import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client({
      region: 'us-east-1',
    });
  }

  async uploadFile(
    file: Buffer,
    key: string,
    contentType: string,
  ) {
    const command = new PutObjectCommand({
      Bucket: 'images-confiteria',
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    return this.s3Client.send(command);
  }
}