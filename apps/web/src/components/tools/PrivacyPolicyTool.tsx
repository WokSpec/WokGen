'use client';

import { useState } from 'react';

type Jurisdiction = 'US' | 'EU' | 'UK' | 'AU';

interface FormState {
  company: string;
  website: string;
  email: string;
  dataCollected: string[];
  jurisdiction: Jurisdiction;
}

const DATA_OPTIONS = [
  { id: 'name',      label: 'Name' },
  { id: 'email',     label: 'Email address' },
  { id: 'ip',        label: 'IP address' },
  { id: 'cookies',   label: 'Cookies / tracking data' },
  { id: 'payment',   label: 'Payment information' },
  { id: 'analytics', label: 'Usage analytics' },
];

const JURISDICTION_LAWS: Record<Jurisdiction, string> = {
  US: 'applicable US federal and state privacy laws',
  EU: 'the General Data Protection Regulation (GDPR)',
  UK: 'the UK GDPR and Data Protection Act 2018',
  AU: 'the Australian Privacy Act 1988',
};

function generatePolicy(f: FormState): string {
  const site = f.website || 'our website';
  const co = f.company || 'We';
  const email = f.email || 'contact@example.com';
  const law = JURISDICTION_LAWS[f.jurisdiction];
  const dataList = f.dataCollected.length
    ? f.dataCollected.map(d => DATA_OPTIONS.find(o => o.id === d)?.label ?? d).join(', ')
    : 'information you voluntarily provide';

  return `PRIVACY POLICY
Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

1. INTRODUCTION
${co} ("we", "us", or "our") operates ${site}. This Privacy Policy explains how we collect, use, and protect your personal information in accordance with ${law}.

2. INFORMATION WE COLLECT
We may collect the following types of information: ${dataList}.

We collect information in the following ways:
- Information you provide directly (e.g., contact forms, account registration)
- Automatically via cookies and similar tracking technologies
- From third-party services and partners

3. HOW WE USE YOUR INFORMATION
We use the information we collect to:
- Provide, operate, and maintain our services
- Improve and personalise your experience
- Process transactions and send related information
- Send administrative information, updates, and security alerts
- Respond to comments and questions
- Comply with legal obligations

4. SHARING YOUR INFORMATION
We do not sell, trade, or rent your personal information to third parties. We may share information with trusted service providers who assist us in operating our website, provided they agree to keep it confidential.

We may disclose information when required by law or to protect our rights and safety.

5. COOKIES
${f.dataCollected.includes('cookies') ? 'We use cookies and similar tracking technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.' : 'We use only essential cookies necessary for the website to function correctly.'}

6. DATA RETENTION
We retain your personal data only for as long as necessary to fulfil the purposes described in this policy, unless a longer retention period is required by law.

7. YOUR RIGHTS
${f.jurisdiction === 'EU' || f.jurisdiction === 'UK' ? `Under ${law}, you have the right to: access, correct, delete, restrict processing of, and port your personal data. You also have the right to object to processing and to withdraw consent at any time.` : `You may request access to, correction of, or deletion of your personal information by contacting us.`}

To exercise any of these rights, please contact us at ${email}.

8. DATA SECURITY
We implement appropriate technical and organisational measures to protect your personal information against unauthorised access, alteration, disclosure, or destruction.

9. THIRD-PARTY LINKS
Our website may contain links to third-party sites. We are not responsible for the privacy practices of those sites and encourage you to read their privacy policies.

10. CHILDREN'S PRIVACY
Our services are not directed to individuals under the age of 13. We do not knowingly collect personal information from children.

11. CHANGES TO THIS POLICY
We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page. Changes are effective immediately upon posting.

12. CONTACT US
If you have questions about this Privacy Policy, please contact us at:
${co}
${f.website ? site + '\n' : ''}Email: ${email}
`;
}

export default function PrivacyPolicyTool() {
  const [form, setForm] = useState<FormState>({
    company: '', website: '', email: '',
    dataCollected: ['email', 'name', 'cookies'],
    jurisdiction: 'US',
  });
  const [policy, setPolicy] = useState('');
  const [copied, setCopied] = useState(false);

  const toggleData = (id: string) => {
    setForm(prev => ({
      ...prev,
      dataCollected: prev.dataCollected.includes(id)
        ? prev.dataCollected.filter(d => d !== id)
        : [...prev.dataCollected, id],
    }));
  };

  const generate = () => setPolicy(generatePolicy(form));

  const copy = () => {
    navigator.clipboard.writeText(policy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const download = () => {
    const blob = new Blob([policy], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'privacy-policy.txt';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="pp-tool">
      <div className="pp-tool__form">
        <div className="pp-tool__row">
          <label className="pp-tool__field">
            <span>Company / Website Name</span>
            <input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Acme Inc." />
          </label>
          <label className="pp-tool__field">
            <span>Website URL</span>
            <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://example.com" />
          </label>
        </div>
        <div className="pp-tool__row">
          <label className="pp-tool__field">
            <span>Contact Email</span>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="privacy@example.com" />
          </label>
          <label className="pp-tool__field">
            <span>Jurisdiction</span>
            <select value={form.jurisdiction} onChange={e => setForm(p => ({ ...p, jurisdiction: e.target.value as Jurisdiction }))}>
              <option value="US">United States</option>
              <option value="EU">European Union (GDPR)</option>
              <option value="UK">United Kingdom</option>
              <option value="AU">Australia</option>
            </select>
          </label>
        </div>

        <div className="pp-tool__checks-label">Data Collected</div>
        <div className="pp-tool__checks">
          {DATA_OPTIONS.map(opt => (
            <label key={opt.id} className="pp-tool__check">
              <input
                type="checkbox"
                checked={form.dataCollected.includes(opt.id)}
                onChange={() => toggleData(opt.id)}
              />
              {opt.label}
            </label>
          ))}
        </div>

        <button className="btn btn-primary" onClick={generate}>Generate Privacy Policy</button>
      </div>

      {policy && (
        <div className="pp-tool__output">
          <div className="pp-tool__output-header">
            <span className="pp-tool__output-title">Generated Policy</span>
            <div className="pp-tool__output-btns">
              <button className="btn btn-sm" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
              <button className="btn btn-sm" onClick={download}>Download .txt</button>
            </div>
          </div>
          <pre className="pp-tool__preview">{policy}</pre>
        </div>
      )}

      <style>{`
        .pp-tool { display: flex; flex-direction: column; gap: 20px; }
        .pp-tool__form {
          background: var(--bg-surface); border: 1px solid var(--surface-border);
          border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 14px;
        }
        .pp-tool__row { display: flex; gap: 12px; flex-wrap: wrap; }
        .pp-tool__field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 160px; font-size: 12px; color: var(--text-secondary); }
        .pp-tool__field input, .pp-tool__field select {
          background: var(--bg); border: 1px solid var(--surface-border); border-radius: 4px;
          color: var(--text); padding: 6px 8px; font-size: 13px;
        }
        .pp-tool__checks-label { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
        .pp-tool__checks { display: flex; flex-wrap: wrap; gap: 10px; }
        .pp-tool__check { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-secondary); cursor: pointer; user-select: none; }
        .pp-tool__output {
          background: var(--bg-surface); border: 1px solid var(--surface-border); border-radius: 8px; overflow: hidden;
        }
        .pp-tool__output-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; border-bottom: 1px solid var(--surface-border); }
        .pp-tool__output-title { font-size: 13px; font-weight: 600; color: var(--text); }
        .pp-tool__output-btns { display: flex; gap: 8px; }
        .pp-tool__preview { padding: 16px; font-size: 12px; white-space: pre-wrap; word-break: break-word; color: var(--text); max-height: 480px; overflow-y: auto; margin: 0; }
        .btn.btn-sm { padding: 5px 12px; font-size: 12px; cursor: pointer; background: rgba(255,255,255,0.06); border: 1px solid var(--surface-border); color: var(--text); border-radius: 4px; }
        .btn.btn-sm:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
