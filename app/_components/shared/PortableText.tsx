import { PortableText as BasePortableText, type PortableTextComponents } from "next-sanity";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className="font-sans text-[16px] leading-[1.7] my-4">{children}</p>,
    h2: ({ children }) => (
      <h2 className="font-display font-bold text-[40px] uppercase tracking-tight leading-tight mt-10 mb-4">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-display font-semibold text-[28px] uppercase leading-tight mt-8 mb-3">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-current pl-5 font-serif italic text-[22px] my-6">{children}</blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc pl-6 my-4 font-sans text-[16px] leading-[1.7]">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal pl-6 my-4 font-sans text-[16px] leading-[1.7]">{children}</ol>,
  },
  marks: {
    link: ({ value, children }) => (
      <a href={value?.href} className="underline underline-offset-4 hover:opacity-70 transition-opacity">
        {children}
      </a>
    ),
    em: ({ children }) => <em className="font-serif italic">{children}</em>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  },
};

export function PortableText({ value }: { value: unknown }) {
  if (!value) return null;
  return <BasePortableText value={value as never} components={components} />;
}
