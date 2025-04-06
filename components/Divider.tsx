"use client";

interface DividerProps {
  text?: string;
}

export function Divider({ text = "or" }: DividerProps) {
  return (
    <div className="relative flex items-center py-2">
      <div className="flex-grow border-t border-muted"></div>
      {text && (
        <span className="mx-4 flex-shrink text-muted-foreground text-sm">
          {text}
        </span>
      )}
      <div className="flex-grow border-t border-muted"></div>
    </div>
  );
}
