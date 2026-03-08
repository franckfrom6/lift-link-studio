import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

interface KBArticleRendererProps {
  content: string;
}

const KBArticleRenderer = ({ content }: KBArticleRendererProps) => {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h1 className="text-[28px] font-bold mt-8 mb-4 text-foreground">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-[22px] font-semibold mt-8 mb-3 text-foreground">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-[18px] font-semibold mt-5 mb-2 text-foreground">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mb-4 leading-[1.7] text-foreground/80">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-6 mb-4 space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-6 mb-4 space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-[1.7] text-foreground/80">{children}</li>
        ),
        blockquote: ({ children }) => (
          <div className="border-l-4 border-accent-foreground/40 pl-4 py-2 my-4 bg-accent/50 rounded-r-lg">
            {children}
          </div>
        ),
        code: ({ children }) => (
          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        a: ({ href, children }) => {
          if (href?.startsWith("/")) {
            return (
              <Link to={href} className="text-accent-foreground hover:underline font-medium">
                {children}
              </Link>
            );
          }
          return (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent-foreground hover:underline font-medium">
              {children}
            </a>
          );
        },
        hr: () => <hr className="my-6 border-border" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

export default KBArticleRenderer;
