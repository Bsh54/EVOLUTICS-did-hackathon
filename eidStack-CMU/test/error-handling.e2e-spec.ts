import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Error handling e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, errorHttpStatusCode: 400 }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/credo-agent/initAgent returns 400 when body missing', async () => {
    const res = await request(app.getHttpServer()).post('/credo-agent/initAgent').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('correlationId');
    expect(res.body).toHaveProperty('statusCode', 400);
  });
});