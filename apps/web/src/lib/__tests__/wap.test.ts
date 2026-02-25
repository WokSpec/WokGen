import { describe, it, expect } from 'vitest';
import { parseWAPFromResponse } from '../wap';

describe('WAP protocol', () => {
  it('parses valid WAP block', () => {
    const response = 'Some text <wap>{"actions":[{"type":"navigate","path":"/gallery"}],"confirmation":"Navigating"}</wap> more text';
    const result = parseWAPFromResponse(response);
    expect(result.wap).not.toBeNull();
    expect(result.wap?.actions).toHaveLength(1);
    expect(result.wap?.actions[0].type).toBe('navigate');
  });

  it('strips the wap block from cleanReply', () => {
    const response = 'Hello <wap>{"actions":[],"confirmation":"ok"}</wap> world';
    const { cleanReply } = parseWAPFromResponse(response);
    expect(cleanReply).toBe('Hello  world');
    expect(cleanReply).not.toContain('<wap>');
  });

  it('returns null wap when no WAP block present', () => {
    const result = parseWAPFromResponse('Just regular text with no WAP');
    expect(result.wap).toBeNull();
    expect(result.cleanReply).toBe('Just regular text with no WAP');
  });

  it('returns null wap on malformed JSON', () => {
    const result = parseWAPFromResponse('<wap>not valid json</wap>');
    expect(result.wap).toBeNull();
  });

  it('handles missing actions array gracefully', () => {
    const result = parseWAPFromResponse('<wap>{"confirmation":"ok"}</wap>');
    expect(result.wap).toBeNull();
  });

  it('handles multiple WAP blocks by taking first', () => {
    const response = '<wap>{"actions":[],"confirmation":"first"}</wap> text <wap>{"actions":[{"type":"navigate","path":"/"}],"confirmation":"second"}</wap>';
    const result = parseWAPFromResponse(response);
    expect(result.wap?.actions).toHaveLength(0);
    expect(result.wap?.confirmation).toBe('first');
  });
});
