"use client";

import { PlusIcon, Loader2Icon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@workspace/ui/components/card";

interface CreateKeyCardProps {
  newKeyName: string;
  setNewKeyName: (name: string) => void;
  isGenerating: boolean;
  handleGenerate: () => void;
}

export function CreateKeyCard({ 
  newKeyName, 
  setNewKeyName, 
  isGenerating, 
  handleGenerate,
}: CreateKeyCardProps) {

  return (
    <Card className="border-primary/20 shadow-xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <PlusIcon className="size-24" />
      </div>
      <CardHeader>
        <CardTitle className="text-lg">Create New Key</CardTitle>
        <CardDescription>
          Keys are document-specific and should be kept secure.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2">
          <label className="text-xs font-medium tracking-wider text-muted-foreground">
            Descriptive Name
          </label>
          <Input
            placeholder="e.g. VS Code Plugin"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            className="text-sm"
          />
        </div>

        <Button 
          className="w-full shadow-lg shadow-primary/20" 
          onClick={handleGenerate} 
          disabled={isGenerating || !newKeyName.trim()}
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <Loader2Icon className="size-4 animate-spin" />
              Generating...
            </div>
          ) : (
            <>
              <PlusIcon className="mr-2 h-4 w-4" />
              Generate Key
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
