import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../server/app';
import { InterventionSchema } from '../../shared/intervention';

const app = createApp({ generate: null });

describe('POST /api/intervention', () => {
  it('returns a complete intervention for a known mood', async () => {
    const res = await request(app).post('/api/intervention').send({ mood: 'overwhelmed' });
    expect(res.status).toBe(200);
    expect(res.body.kind).toBe('intervention');
    expect(InterventionSchema.safeParse(res.body.intervention).success).toBe(true);
  });

  it('accepts optional context', async () => {
    const res = await request(app)
      .post('/api/intervention')
      .send({ mood: 'stressed', energy: 2, mentalLoad: 5, contributors: ['work'], need: 'to-focus', note: 'Deadline tomorrow' });
    expect(res.status).toBe(200);
  });

  it.each([
    [{}],
    [{ mood: '' }],
    [{ mood: 123 }],
    [{ mood: 'x'.repeat(101) }],
    [{ mood: 'sad', energy: 9 }],
    [{ mood: 'sad', contributors: ['not-a-real-option'] }],
    [{ mood: 'sad', note: 'x'.repeat(281) }],
  ])('rejects invalid input %j', async (body) => {
    const res = await request(app).post('/api/intervention').send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });
});
