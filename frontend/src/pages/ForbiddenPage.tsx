import { Link } from 'react-router';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold">You do not have access to that page</h1>
      <Link to="/" className="text-indigo-600 hover:underline">
        Go to your home page
      </Link>
    </div>
  );
}