"use client";

import { useState, useRef } from "react";
import { Upload, ImageIcon, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ImageUploaderProps {
  onImageSelected: (dataUrl: string, hint?: string) => void;
  className?: string;
}

export function ImageUploader({ onImageSelected, className }: ImageUploaderProps) {
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onImageSelected(reader.result as string, file.name);
    reader.readAsDataURL(file);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        className="border-2 border-dashed border-primary/30 rounded-2xl p-8 text-center hover:bg-primary/5 transition-colors cursor-pointer"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-10 w-10 text-primary mx-auto mb-3" />
        <p className="font-medium text-navy">ارفع صورة أو التقط من الكاميرا</p>
        <p className="text-xs text-muted-foreground mt-1">PNG, JPG — تُعالج مؤقتًا ولا تُحفظ</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="أو الصق رابط الصورة"
          className="flex-1"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => url && onImageSelected(url, url)}
          disabled={!url}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => inputRef.current?.click()}>
          <ImageIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
