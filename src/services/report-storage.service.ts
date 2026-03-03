import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config';
import { reportRepository } from '../repositories/report.repository';
import { ReportStatus } from '@prisma/client';
import { logger } from '../infrastructure/logger';
import * as fs from 'fs';
import * as path from 'path';

export class ReportStorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private useLocalStorage: boolean;
  private localStoragePath: string;

  constructor() {
    const awsRegion = config.get('AWS_REGION');
    const awsAccessKeyId = config.get('AWS_ACCESS_KEY_ID');
    const awsSecretAccessKey = config.get('AWS_SECRET_ACCESS_KEY');
    this.bucketName = config.get('S3_BUCKET_NAME') || 'aidlc-reports';

    // Use local storage if S3 credentials are not configured
    this.useLocalStorage = !awsAccessKeyId || !awsSecretAccessKey;

    if (this.useLocalStorage) {
      this.localStoragePath = path.join(process.cwd(), 'storage', 'reports');
      this.ensureLocalStorageDirectory();
      logger.info('Using local file storage for reports');
    } else {
      this.s3Client = new S3Client({
        region: awsRegion,
        credentials: {
          accessKeyId: awsAccessKeyId!,
          secretAccessKey: awsSecretAccessKey!,
        },
      });
      logger.info('Using AWS S3 for report storage');
    }
  }

  private ensureLocalStorageDirectory(): void {
    if (!fs.existsSync(this.localStoragePath)) {
      fs.mkdirSync(this.localStoragePath, { recursive: true });
    }
  }

  async uploadReport(
    reportId: string,
    fileBuffer: Buffer,
    fileName: string,
    contentType: string
  ): Promise<{ fileUrl: string; fileSize: number }> {
    try {
      const fileSize = fileBuffer.length;
      const maxSizeMB = config.get('MAX_REPORT_SIZE_MB');
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      if (fileSize > maxSizeBytes) {
        throw new Error(`Report size ${fileSize} bytes exceeds maximum ${maxSizeBytes} bytes`);
      }

      const key = `reports/${reportId}/${fileName}`;

      if (this.useLocalStorage) {
        return await this.uploadToLocalStorage(key, fileBuffer, fileSize);
      } else {
        return await this.uploadToS3(key, fileBuffer, contentType, fileSize);
      }
    } catch (error) {
      logger.error(`Error uploading report ${reportId}:`, error);
      throw error;
    }
  }

  private async uploadToS3(
    key: string,
    fileBuffer: Buffer,
    contentType: string,
    fileSize: number
  ): Promise<{ fileUrl: string; fileSize: number }> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await this.s3Client.send(command);

    const fileUrl = `s3://${this.bucketName}/${key}`;
    logger.info(`Report uploaded to S3: ${fileUrl}`);

    return { fileUrl, fileSize };
  }

  private async uploadToLocalStorage(
    key: string,
    fileBuffer: Buffer,
    fileSize: number
  ): Promise<{ fileUrl: string; fileSize: number }> {
    const filePath = path.join(this.localStoragePath, key);
    const directory = path.dirname(filePath);

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    fs.writeFileSync(filePath, fileBuffer);

    const fileUrl = `file://${filePath}`;
    logger.info(`Report saved locally: ${fileUrl}`);

    return { fileUrl, fileSize };
  }

  async getSignedDownloadUrl(reportId: string): Promise<string> {
    try {
      const report = await reportRepository.findById(reportId);
      if (!report || !report.fileUrl) {
        throw new Error('Report not found or file URL missing');
      }

      if (report.status !== ReportStatus.COMPLETED) {
        throw new Error('Report is not ready for download');
      }

      if (report.expiresAt && report.expiresAt < new Date()) {
        throw new Error('Report has expired');
      }

      if (this.useLocalStorage) {
        // For local storage, return the file path
        return report.fileUrl;
      } else {
        return await this.generateS3SignedUrl(report.fileUrl);
      }
    } catch (error) {
      logger.error(`Error generating signed URL for report ${reportId}:`, error);
      throw error;
    }
  }

  private async generateS3SignedUrl(s3Url: string): Promise<string> {
    // Extract key from S3 URL (format: s3://bucket/key)
    const key = s3Url.replace(`s3://${this.bucketName}/`, '');

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const expirationDays = config.get('SIGNED_URL_EXPIRATION_DAYS');
    const expiresIn = expirationDays * 24 * 60 * 60; // Convert days to seconds

    const signedUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
    return signedUrl;
  }

  async deleteReport(reportId: string): Promise<void> {
    try {
      const report = await reportRepository.findById(reportId);
      if (!report || !report.fileUrl) {
        logger.warn(`Report ${reportId} not found or already deleted`);
        return;
      }

      if (this.useLocalStorage) {
        await this.deleteFromLocalStorage(report.fileUrl);
      } else {
        await this.deleteFromS3(report.fileUrl);
      }

      await reportRepository.delete(reportId);
      logger.info(`Report ${reportId} deleted successfully`);
    } catch (error) {
      logger.error(`Error deleting report ${reportId}:`, error);
      throw error;
    }
  }

  private async deleteFromS3(s3Url: string): Promise<void> {
    const key = s3Url.replace(`s3://${this.bucketName}/`, '');

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
    logger.info(`Report deleted from S3: ${s3Url}`);
  }

  private async deleteFromLocalStorage(fileUrl: string): Promise<void> {
    const filePath = fileUrl.replace('file://', '');

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Report deleted from local storage: ${filePath}`);
    }
  }

  async cleanupExpiredReports(): Promise<number> {
    try {
      const expiredReports = await reportRepository.findAll({
        where: {
          expiresAt: { lt: new Date() },
          status: ReportStatus.COMPLETED,
        },
      });

      let deletedCount = 0;

      for (const report of expiredReports) {
        try {
          await this.deleteReport(report.id);
          deletedCount++;
        } catch (error) {
          logger.error(`Failed to delete expired report ${report.id}:`, error);
        }
      }

      logger.info(`Cleaned up ${deletedCount} expired reports`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up expired reports:', error);
      throw error;
    }
  }

  async getReportFile(reportId: string): Promise<Buffer> {
    try {
      const report = await reportRepository.findById(reportId);
      if (!report || !report.fileUrl) {
        throw new Error('Report not found or file URL missing');
      }

      if (this.useLocalStorage) {
        return await this.getFileFromLocalStorage(report.fileUrl);
      } else {
        return await this.getFileFromS3(report.fileUrl);
      }
    } catch (error) {
      logger.error(`Error retrieving report file ${reportId}:`, error);
      throw error;
    }
  }

  private async getFileFromS3(s3Url: string): Promise<Buffer> {
    const key = s3Url.replace(`s3://${this.bucketName}/`, '');

    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    const stream = response.Body as any;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  private async getFileFromLocalStorage(fileUrl: string): Promise<Buffer> {
    const filePath = fileUrl.replace('file://', '');

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    return fs.readFileSync(filePath);
  }

  async updateReportExpiration(reportId: string, expiresAt: Date): Promise<void> {
    await reportRepository.update(reportId, { expiresAt });
    logger.info(`Updated expiration for report ${reportId} to ${expiresAt}`);
  }

  getStorageInfo(): { type: string; location: string } {
    if (this.useLocalStorage) {
      return {
        type: 'local',
        location: this.localStoragePath,
      };
    } else {
      return {
        type: 's3',
        location: `s3://${this.bucketName}`,
      };
    }
  }
}

export const reportStorageService = new ReportStorageService();
