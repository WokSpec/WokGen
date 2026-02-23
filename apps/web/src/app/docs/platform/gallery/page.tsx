import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Gallery · Docs',
  description: 'How the WokGen gallery works — browsing, saving, lightbox, moderation, and limits.',
};

export default function DocsGallery() {
  return (
    <div className="docs-page">
      <div className="docs-page-inner">

        {/* Sidebar */}
        <aside className="docs-sidebar">
          <Link href="/docs" className="docs-back">← Docs Hub</Link>
          <div className="docs-sidebar-mode">
             Gallery
          </div>
          <nav className="docs-toc">
            <a href="#overview"       className="docs-toc-link">What the Gallery Is</a>
            <a href="#browsing"       className="docs-toc-link">Browsing</a>
            <a href="#saving"         className="docs-toc-link">Saving to Gallery</a>
            <a href="#public-private" className="docs-toc-link">Public vs Private</a>
            <a href="#downloading"    className="docs-toc-link">Downloading</a>
            <a href="#lightbox"       className="docs-toc-link">Lightbox</a>
            <a href="#generate-from"  className="docs-toc-link">Generate Similar</a>
            <a href="#moderation"     className="docs-toc-link">Moderation</a>
            <a href="#limits"         className="docs-toc-link">Gallery Limits</a>
          </nav>
          <div className="docs-sidebar-links">
            <Link href="/pixel/gallery"    className="docs-toc-link">Pixel Gallery →</Link>
            <Link href="/business/gallery" className="docs-toc-link">Business Gallery →</Link>
          </div>
        </aside>

        {/* Content */}
        <main className="docs-content">
          <div className="docs-content-header">
            <h1 className="docs-title">Gallery</h1>
            <p className="docs-subtitle">
              Browse community-created assets, share your own generations, find inspiration,
              and jump back into the studio from any image you see.
            </p>
          </div>

          {/* ── What the Gallery Is ── */}
          <section id="overview">
            <h2 className="docs-h2">What the Gallery Is</h2>
            <p className="docs-p">
              The WokGen gallery serves two purposes: it is a <strong>community showcase</strong> of
              publicly saved assets, and a <strong>personal history</strong> of everything you&apos;ve
              generated. Both views live on the same gallery page — a tab or filter toggles between them.
            </p>
            <p className="docs-p">
              The community gallery is publicly visible without signing in. Anyone can browse assets
              shared by WokGen users, see the prompts used, and download images for use in their own
              projects. Signing in adds the ability to save your own assets and filter to your personal history.
            </p>
            <p className="docs-p">
              Each studio mode has its own gallery — Pixel Studio assets appear in the Pixel Gallery
              (<Link href="/pixel/gallery" className="docs-code">/pixel/gallery</Link>), and Business
              Studio assets appear in the Business Gallery (
              <Link href="/business/gallery" className="docs-code">/business/gallery</Link>). Assets
              from different modes are never mixed.
            </p>
          </section>

          {/* ── Browsing ── */}
          <section id="browsing">
            <h2 className="docs-h2">Browsing</h2>
            <p className="docs-p">
              The gallery grid supports infinite scroll — as you scroll down, more assets load
              automatically. No pagination buttons required.
            </p>
            <p className="docs-p">The following filters are available at the top of the gallery:</p>
            <ul className="docs-ul">
              <li className="docs-li">
                <strong>Mode filter</strong> — switch between Pixel and Business galleries when
                viewing from a combined entry point.
              </li>
              <li className="docs-li">
                <strong>Mine / Community tabs</strong> — &ldquo;Mine&rdquo; shows only your saved
                gallery assets. &ldquo;Community&rdquo; shows all public assets from all users.
                The Mine tab requires being signed in.
              </li>
              <li className="docs-li">
                <strong>Sort: Recent / Popular</strong> — Recent sorts by save date descending
                (newest first). Popular sorts by the number of downloads or views the asset has
                received, surfacing crowd favorites.
              </li>
            </ul>
            <div className="docs-callout docs-callout--info">
              <span className="docs-callout-icon">i</span>
              <span>
                A search bar to filter gallery assets by prompt text is coming soon. For now,
                use the mode and sort filters to navigate the community feed.
              </span>
            </div>
          </section>

          {/* ── Saving to Gallery ── */}
          <section id="saving">
            <h2 className="docs-h2">Saving to Gallery</h2>
            <p className="docs-p">
              After a generation completes in any studio, the output panel shows a{' '}
              <strong>Save to Gallery</strong> button. Clicking it creates a public{' '}
              <code className="docs-code">GalleryAsset</code> record linked to your account, making
              the image and its prompt visible in the community gallery.
            </p>
            <ul className="docs-ul">
              <li className="docs-li">You must be signed in to save to the gallery.</li>
              <li className="docs-li">Saving is always a deliberate action — generations do not
                appear in the public gallery automatically.</li>
              <li className="docs-li">You can save multiple results from the same session, including
                variations and re-generations.</li>
              <li className="docs-li">Saved assets appear in your <strong>Mine</strong> tab immediately
                after saving.</li>
            </ul>
            <div className="docs-callout docs-callout--warn">
              <span className="docs-callout-icon">!</span>
              <span>
                Prompts are publicly visible when you save to the gallery. Do not include personal
                information, private brand names, or confidential details in prompts you intend to save.
              </span>
            </div>
          </section>

          {/* ── Public vs Private ── */}
          <section id="public-private">
            <h2 className="docs-h2">Public vs Private</h2>
            <p className="docs-p">
              All gallery saves are <strong>public by default</strong>. There is currently no option
              to save a generation to a private gallery — the Save to Gallery action always creates
              a publicly visible asset.
            </p>
            <p className="docs-p">
              Your generation <strong>job history</strong> (visible in the studio&apos;s history panel
              and via <code className="docs-code">GET /api/generate?mine=true</code>) is always private —
              it shows all your generations regardless of whether they were saved to the gallery. This
              is separate from the public gallery.
            </p>
            <p className="docs-p">
              A private gallery option (save without public visibility) is on the roadmap for Plus
              and above plans.
            </p>
          </section>

          {/* ── Downloading ── */}
          <section id="downloading">
            <h2 className="docs-h2">Downloading from Gallery</h2>
            <p className="docs-p">
              Any asset in the gallery can be downloaded. There are two ways:
            </p>
            <ul className="docs-ul">
              <li className="docs-li">
                <strong>Download button</strong> — in the lightbox view (click any image to open it),
                there is a dedicated Download button that triggers a browser file download of the
                full-resolution PNG (or GIF for animations).
              </li>
              <li className="docs-li">
                <strong>Right-click save</strong> — standard browser right-click &rarr; &ldquo;Save
                image as&rdquo; works on any gallery image.
              </li>
            </ul>
            <p className="docs-p">
              All gallery images are served at their original generation resolution. There is no
              compression or resizing applied to gallery-saved assets.
            </p>
            <div className="docs-callout docs-callout--info">
              <span className="docs-callout-icon">i</span>
              <span>
                Assets in the gallery are hosted on CDN URLs. You do not need to be signed in
                to download community assets.
              </span>
            </div>
          </section>

          {/* ── Lightbox ── */}
          <section id="lightbox">
            <h2 className="docs-h2">Lightbox</h2>
            <p className="docs-p">
              Clicking any image in the gallery opens it in a <strong>lightbox</strong> — a full-size
              overlay with additional context and actions. The lightbox shows:
            </p>
            <ul className="docs-ul">
              <li className="docs-li"><strong>Full-size image</strong> — rendered at its native resolution.</li>
              <li className="docs-li"><strong>Prompt</strong> — the exact text prompt used to generate the image.</li>
              <li className="docs-li"><strong>Tool</strong> — which studio tool was used (e.g., Generate, Scene, Animate).</li>
              <li className="docs-li"><strong>Seed</strong> — the resolved seed value, allowing exact reproduction.</li>
              <li className="docs-li"><strong>Mode</strong> — Pixel or Business, and any relevant style/mood metadata.</li>
              <li className="docs-li"><strong>Author</strong> — the display name of the user who saved the asset.</li>
              <li className="docs-li"><strong>Download button</strong> — download the full-resolution file.</li>
              <li className="docs-li"><strong>Generate Similar button</strong> — opens the studio with this asset&apos;s
                prompt pre-filled (see <a href="#generate-from">Generate Similar</a>).</li>
            </ul>
            <p className="docs-p">
              Close the lightbox by clicking outside the image, pressing Escape, or using the close button.
            </p>
          </section>

          {/* ── Generate Similar ── */}
          <section id="generate-from">
            <h2 className="docs-h2">Generating from Gallery</h2>
            <p className="docs-p">
              Every asset in the lightbox has a <strong>Generate Similar</strong> button. Clicking it
              opens the relevant studio (Pixel or Business) with the prompt, style, mood, and other
              metadata from the gallery asset pre-filled in the input fields.
            </p>
            <p className="docs-p">
              This makes the gallery a <strong>jumping-off point for creative exploration</strong> —
              find a style you like, open it in the studio, tweak the prompt, and generate your own
              variation without starting from scratch.
            </p>
            <ul className="docs-ul">
              <li className="docs-li">The studio opens with all available metadata fields pre-filled.</li>
              <li className="docs-li">You can edit any field before generating — nothing is locked.</li>
              <li className="docs-li">The seed is <em>not</em> pre-filled by default, so you&apos;ll get a
                new variation. You can manually enter the original seed from the lightbox if you want
                to reproduce the exact output.</li>
            </ul>
          </section>

          {/* ── Moderation ── */}
          <section id="moderation">
            <h2 className="docs-h2">Moderation</h2>
            <p className="docs-p">
              The public gallery is moderated to keep it a safe and useful community resource.
            </p>
            <ul className="docs-ul">
              <li className="docs-li">
                <strong>Report button</strong> — every asset in the lightbox has a report button.
                Use it to flag content that violates community guidelines (offensive imagery,
                NSFW content, impersonation, etc.).
              </li>
              <li className="docs-li">
                <strong>Removal</strong> — reported assets are reviewed and removed if they violate
                the terms of service. Removal is at the moderators&apos; discretion.
              </li>
              <li className="docs-li">
                <strong>Account suspension</strong> — accounts that repeatedly save offensive,
                harmful, or abusive content will be suspended. Suspension prevents generating,
                saving, and signing in.
              </li>
              <li className="docs-li">
                <strong>Prompt filtering</strong> — basic prompt filtering is applied at generation
                time to block clearly inappropriate content before it reaches the gallery.
              </li>
            </ul>
            <div className="docs-callout docs-callout--warn">
              <span className="docs-callout-icon">!</span>
              <span>
                Do not use WokGen to generate hateful, violent, sexually explicit, or otherwise
                harmful content. Violations result in asset removal and potential account suspension.
              </span>
            </div>
          </section>

          {/* ── Gallery Limits ── */}
          <section id="limits">
            <h2 className="docs-h2">Gallery Limits</h2>
            <p className="docs-p">
              There is <strong>no limit</strong> on the number of assets you can save to the gallery
              on any plan — Free, Plus, Pro, or Max. Save as many results as you like.
            </p>
            <ul className="docs-ul">
              <li className="docs-li">
                <strong>Storage</strong> — gallery assets are stored as CDN URLs pointing to the
                images hosted by the AI inference provider. WokGen does not store image files on its
                own servers, so there is no storage quota to manage.
              </li>
              <li className="docs-li">
                <strong>CDN URL lifetime</strong> — CDN URLs provided by inference providers may
                expire over time. Download important assets to your device for permanent storage.
              </li>
              <li className="docs-li">
                <strong>Deleting gallery assets</strong> — you can remove your own saved assets from
                the gallery via the lightbox menu while signed in. Deletion removes the asset from
                the public gallery immediately. The underlying job record in your history is not deleted.
              </li>
            </ul>
          </section>

          <div className="docs-content-footer">
            <Link href="/pixel/gallery"    className="btn-primary btn-sm">Pixel Gallery →</Link>
            <Link href="/business/gallery" className="btn-ghost btn-sm">Business Gallery →</Link>
          </div>
        </main>
      </div>
    </div>
  );
}
