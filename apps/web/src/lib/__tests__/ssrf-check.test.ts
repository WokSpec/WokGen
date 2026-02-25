import { describe, it, expect } from 'vitest';
import { checkSsrf } from '../ssrf-check';

describe('checkSsrf', () => {
  it('allows external HTTPS URLs', () => {
    const result = checkSsrf('https://example.com/image.png');
    expect(result.ok).toBe(true);
  });

  it('allows external HTTP URLs', () => {
    const result = checkSsrf('http://example.com/image.png');
    expect(result.ok).toBe(true);
  });

  it('blocks localhost by hostname', () => {
    expect(checkSsrf('http://localhost:8080').ok).toBe(false);
  });

  it('blocks 127.x.x.x loopback', () => {
    expect(checkSsrf('http://127.0.0.1/admin').ok).toBe(false);
  });

  it('blocks RFC1918 192.168.x.x', () => {
    expect(checkSsrf('http://192.168.1.1').ok).toBe(false);
  });

  it('blocks RFC1918 10.x.x.x', () => {
    expect(checkSsrf('http://10.0.0.1').ok).toBe(false);
  });

  it('blocks RFC1918 172.16-31.x.x', () => {
    expect(checkSsrf('http://172.16.0.1').ok).toBe(false);
    expect(checkSsrf('http://172.31.255.255').ok).toBe(false);
  });

  it('blocks AWS IMDS endpoint', () => {
    expect(checkSsrf('http://169.254.169.254').ok).toBe(false);
  });

  it('blocks file:// protocol', () => {
    expect(checkSsrf('file:///etc/passwd').ok).toBe(false);
  });

  it('blocks ftp:// protocol', () => {
    expect(checkSsrf('ftp://example.com').ok).toBe(false);
  });

  it('blocks invalid URLs', () => {
    expect(checkSsrf('not a url').ok).toBe(false);
  });

  it('enforces requireHttps when set', () => {
    expect(checkSsrf('http://example.com', true).ok).toBe(false);
    expect(checkSsrf('https://example.com', true).ok).toBe(true);
  });
});
