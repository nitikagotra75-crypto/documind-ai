import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

export default function MarkdownView({ content }: { content: string }) {
  return (
    <div className="prose-doc">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const text = String(children).replace(/\n$/, "");
            if (!inline && match) {
              return <CodeBlock language={match[1]} code={text} />;
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content || ""}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group my-3">
      <button
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition glass rounded-md p-2 text-xs flex items-center gap-1"
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
      </button>
      <SyntaxHighlighter
        language={language}
        style={oneDark as any}
        customStyle={{ borderRadius: 12, margin: 0, fontSize: 13 }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
