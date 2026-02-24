'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

type Tab = 'qr' | 'wallet' | 'numconv';

/* ── Wallet Validation ── */
const BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function isBase58(s: string): boolean {
  return s.split('').every(c => BASE58_CHARS.includes(c));
}

type CoinResult = { coin: string; icon: string; valid: boolean; reason: string } | null;

function detectWallet(addr: string): CoinResult {
  const a = addr.trim();
  if (!a) return null;

  // ETH: 0x + 40 hex chars
  if (a.startsWith('0x') && a.length === 42 && /^0x[0-9a-fA-F]{40}$/.test(a)) {
    return { coin: 'Ethereum (ETH)', icon: '⟠', valid: true, reason: 'Valid EVM address' };
  }
  if (a.startsWith('0x')) {
    return { coin: 'Ethereum (ETH)', icon: '⟠', valid: false, reason: `Invalid length (${a.length}/42) or non-hex chars` };
  }

  // BTC
  if (a.startsWith('bc1')) {
    if (a.length >= 25 && a.length <= 62) return { coin: 'Bitcoin (BTC)', icon: '₿', valid: true, reason: 'Valid bech32 native SegWit address' };
    return { coin: 'Bitcoin (BTC)', icon: '₿', valid: false, reason: `Invalid bech32 length (${a.length})` };
  }
  if ((a.startsWith('1') || a.startsWith('3')) && a.length >= 25 && a.length <= 34 && isBase58(a)) {
    return { coin: 'Bitcoin (BTC)', icon: '₿', valid: true, reason: a.startsWith('1') ? 'Legacy P2PKH address' : 'P2SH address' };
  }

  // XMR: starts with 4, length ~95
  if (a.startsWith('4') && a.length >= 90 && a.length <= 100 && isBase58(a)) {
    return { coin: 'Monero (XMR)', icon: '🔒', valid: true, reason: 'Valid Monero address' };
  }

  // SOL: Base58, 32-44 chars
  if (isBase58(a) && a.length >= 32 && a.length <= 44) {
    return { coin: 'Solana (SOL)', icon: '◎', valid: true, reason: 'Valid Solana address (Base58)' };
  }

  return { coin: 'Unknown', icon: '❓', valid: false, reason: 'Could not detect coin type' };
}

/* ── Number Conversion ── */
function detectAndConvert(raw: string): { hex: string; dec: string; bin: string; error: string } {
  const s = raw.trim();
  const empty = { hex: '', dec: '', bin: '', error: '' };
  if (!s) return empty;
  try {
    let val: number;
    if (/^-?0[xX][0-9a-fA-F]+$/.test(s)) {
      val = parseInt(s, 16);
    } else if (/^-?0[bB][01]+$/.test(s)) {
      val = parseInt(s.replace(/^(-?)0[bB]/, '$1'), 2);
    } else if (/^-?\d+$/.test(s)) {
      val = parseInt(s, 10);
    } else {
      return { ...empty, error: 'Invalid number' };
    }
    if (!isFinite(val)) return { ...empty, error: 'Number out of range' };
    const neg = val < 0;
    const abs = Math.abs(val);
    return {
      hex: (neg ? '-0x' : '0x') + abs.toString(16).toUpperCase(),
      dec: val.toString(10),
      bin: (neg ? '-0b' : '0b') + abs.toString(2),
      error: '',
    };
  } catch {
    return { ...empty, error: 'Invalid number' };
  }
}

export default function CryptoUtilsTool() {
  const [tab, setTab] = useState<Tab>('qr');

  /* ── QR state ── */
  const [qrText, setQrText] = useState('');
  const [qrPng, setQrPng] = useState('');
  const [qrSvg, setQrSvg] = useState('');
  const [qrError, setQrError] = useState('');
  const qrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (qrTimerRef.current) clearTimeout(qrTimerRef.current);
    if (!qrText.trim()) { setQrPng(''); setQrSvg(''); setQrError(''); return; }
    qrTimerRef.current = setTimeout(async () => {
      try {
        const png = await QRCode.toDataURL(qrText, { width: 300, margin: 2 });
        const svg = await QRCode.toString(qrText, { type: 'svg' });
        setQrPng(png);
        setQrSvg(svg);
        setQrError('');
      } catch (e) {
        setQrError((e as Error).message);
      }
    }, 300);
    return () => { if (qrTimerRef.current) clearTimeout(qrTimerRef.current); };
  }, [qrText]);

  const downloadQrPng = () => {
    const a = document.createElement('a');
    a.href = qrPng;
    a.download = 'qrcode.png';
    a.click();
  };

  const downloadQrSvg = () => {
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qrcode.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Wallet state ── */
  const [walletAddr, setWalletAddr] = useState('');
  const walletResult = detectWallet(walletAddr);

  /* ── Num conv state ── */
  const [numInput, setNumInput] = useState('');
  const numResult = detectAndConvert(numInput);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'qr', label: '📱 QR Code' },
    { id: 'wallet', label: '💳 Wallet Validator' },
    { id: 'numconv', label: '🔢 Hex / Dec / Bin' },
  ];

  return (
    <div className="crypto-tool">
      <div className="pdf-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`pdf-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── QR Code ── */}
      {tab === 'qr' && (
        <div className="pdf-panel">
          <label className="pdf-label">Text or URL</label>
          <input
            className="tool-input"
            placeholder="https://example.com"
            value={qrText}
            onChange={e => setQrText(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem' }}
          />
          {qrError && <p className="pdf-error">{qrError}</p>}
          {qrPng && (
            <div className="crypto-qr-result">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrPng} alt="QR Code" className="crypto-qr-img" />
              <div className="pdf-actions">
                <button className="btn-primary" onClick={downloadQrPng}>⬇ PNG</button>
                <button className="btn-ghost" onClick={downloadQrSvg}>⬇ SVG</button>
              </div>
            </div>
          )}
          {!qrPng && !qrError && (
            <div className="crypto-qr-placeholder">Enter text above to generate QR code</div>
          )}
        </div>
      )}

      {/* ── Wallet Validator ── */}
      {tab === 'wallet' && (
        <div className="pdf-panel">
          <label className="pdf-label">Wallet Address</label>
          <input
            className="tool-input"
            placeholder="Paste BTC, ETH, SOL, or XMR address…"
            value={walletAddr}
            onChange={e => setWalletAddr(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem' }}
          />
          {walletResult && (
            <div className={`crypto-wallet-result ${walletResult.valid ? 'valid' : 'invalid'}`}>
              <div className="crypto-wallet-icon">{walletResult.icon}</div>
              <div className="crypto-wallet-info">
                <div className="crypto-wallet-coin">{walletResult.coin}</div>
                <div className="crypto-wallet-status">
                  {walletResult.valid ? '✅ Valid' : '❌ Invalid'} — {walletResult.reason}
                </div>
              </div>
            </div>
          )}
          {!walletAddr && (
            <div className="crypto-qr-placeholder">Enter a wallet address to validate</div>
          )}
        </div>
      )}

      {/* ── Hex/Dec/Bin ── */}
      {tab === 'numconv' && (
        <div className="pdf-panel">
          <label className="pdf-label">Number (auto-detects 0x hex, 0b binary, else decimal)</label>
          <input
            className="tool-input"
            placeholder="e.g. 255 or 0xff or 0b11111111"
            value={numInput}
            onChange={e => setNumInput(e.target.value)}
            style={{ width: '100%', marginBottom: '1rem', fontFamily: 'monospace' }}
          />
          {numResult.error && <p className="pdf-error">{numResult.error}</p>}
          {numResult.dec && (
            <table className="pdf-info-table">
              <tbody>
                <tr><th>Hexadecimal</th><td><code>{numResult.hex}</code></td></tr>
                <tr><th>Decimal</th><td><code>{numResult.dec}</code></td></tr>
                <tr><th>Binary</th><td><code style={{ wordBreak: 'break-all' }}>{numResult.bin}</code></td></tr>
              </tbody>
            </table>
          )}
          {!numInput && (
            <div className="crypto-qr-placeholder">Enter a number to convert</div>
          )}
        </div>
      )}
    </div>
  );
}
