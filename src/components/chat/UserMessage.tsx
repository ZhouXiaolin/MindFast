import ReactMarkdown from "react-markdown";

interface UserMessageProps {
  content: string;
}

export function UserMessage({ content }: UserMessageProps) {
  return (
    <div className="flex justify-start">
      <div className="user-message-container max-w-[85%] rounded-2xl bg-emerald-600/30 px-4 py-2.5 text-sidebar">
        <div className="prose prose-sm dark:prose-invert max-w-none break-words">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
