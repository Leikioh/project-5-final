import React from "react";

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; name: string | null; email: string };
}

interface CommentListProps {
  comments?: Comment[];
}

export default function CommentList({ comments }: CommentListProps) {
  if (!comments || comments.length === 0) {
    return <p className="text-gray-500">Pas encore de commentaires.</p>;
  }

  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <li key={c.id} className="p-4 bg-gray-100 rounded-lg">
          <p className="text-gray-800 mb-2">{c.content}</p>
          <div className="text-sm text-gray-600">
            Par {c.author.name ?? c.author.email} le{" "}
            {new Date(c.createdAt).toLocaleDateString()}
          </div>
        </li>
      ))}
    </ul>
  );
}
