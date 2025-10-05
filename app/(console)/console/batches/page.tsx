import { SectionHeading } from "@/components/patterns/section-heading";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle } from "lucide-react";

const placeholderBatches = [
  {
    id: "rg-1234",
    prompt: "v3-introspective",
    models: "GPT-5 Mini, Claude 4.5, Gemini 2.5",
    status: "Queued",
    createdAt: "—",
  },
];

export default function BatchesPage() {
  return (
    <div className="space-y-8">
      <SectionHeading
        title="Batch manager"
        description="Launch new comparisons, monitor progress, and triage failures."
        actions={
          <Button size="sm">
            <PlusCircle className="h-4 w-4" /> New batch
          </Button>
        }
      />

      <Card className="border-border/60 bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                <TableHead className="w-[140px]">Run group</TableHead>
                <TableHead>Prompt</TableHead>
                <TableHead>Artists</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {placeholderBatches.map((batch) => (
                <TableRow key={batch.id} className="text-sm">
                  <TableCell className="font-mono text-xs">{batch.id}</TableCell>
                  <TableCell>{batch.prompt}</TableCell>
                  <TableCell>{batch.models}</TableCell>
                  <TableCell>{batch.status}</TableCell>
                  <TableCell className="text-right">{batch.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
