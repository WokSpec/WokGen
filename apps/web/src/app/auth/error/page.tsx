export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">✗</div>
        <h1 className="text-xl font-bold text-white mb-2">Authentication error</h1>
        <p className="text-slate-400 text-sm mb-6">
          Something went wrong during sign in. Please try again.
        </p>
        <a href="/auth/signin" className="text-violet-400 hover:text-violet-300 text-sm font-medium">
          Back to sign in →
        </a>
      </div>
    </div>
  );
}
