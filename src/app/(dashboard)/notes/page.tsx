"use client";

import { useState, useRef } from "react";
import { motion, useMotionValue } from "framer-motion";
import { Plus, X, Palette, StickyNote, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from "@/hooks/useNotes";
import type { StickyNote as StickyNoteType, UpdateNotePayload } from "@/types";

const COLORS = [
  { bg: "#fef9c3", text: "#78350f" },
  { bg: "#dbeafe", text: "#1e3a5f" },
  { bg: "#dcfce7", text: "#14532d" },
  { bg: "#fce7f3", text: "#831843" },
  { bg: "#ffedd5", text: "#7c2d12" },
  { bg: "#f3e8ff", text: "#581c87" },
];

export default function NotesPage() {
  const boardRef = useRef<HTMLDivElement>(null);
  const { data: notes = [], isLoading } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const maxZ = notes.length > 0 ? Math.max(...notes.map((n) => n.z_index)) : 10;

  const handleAdd = () => {
    const count = notes.length;
    createNote.mutate({
      topic: "New Note",
      content: "",
      color: COLORS[count % COLORS.length].bg,
      pos_x: 32 + (count % 6) * 32,
      pos_y: 32 + Math.floor(count / 6) * 28,
      rotation: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)),
      z_index: maxZ + 1,
    });
  };

  const handleUpdate = (payload: UpdateNotePayload) => {
    updateNote.mutate(payload);
  };

  const handleBringToFront = (id: string) => {
    updateNote.mutate({ id, z_index: maxZ + 1 });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
            <StickyNote className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Notes</h1>
            <p className="text-xs text-muted-foreground">
              Drag and drop your finance reminders anywhere on the board
            </p>
          </div>
        </div>
        <Button
          onClick={handleAdd}
          size="sm"
          className="gap-2"
          disabled={createNote.isPending}
        >
          {createNote.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add Note
        </Button>
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        className="relative overflow-hidden"
        style={{
          flex: 1,
          minHeight: "calc(100vh - 73px)",
          backgroundImage:
            "radial-gradient(circle, hsl(var(--border)/0.5) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          backgroundColor: "hsl(var(--muted)/0.2)",
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
          </div>
        )}

        {!isLoading && notes.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none"
          >
            <StickyNote className="h-14 w-14 text-muted-foreground/15" />
            <p className="text-sm font-medium text-muted-foreground">
              Board is empty
            </p>
            <p className="text-xs text-muted-foreground/60">
              Click &ldquo;Add Note&rdquo; to create your first sticky note
            </p>
          </motion.div>
        )}

        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            boardRef={boardRef as React.RefObject<HTMLElement>}
            onUpdate={handleUpdate}
            onDelete={() => deleteNote.mutate(note.id)}
            onFocus={() => handleBringToFront(note.id)}
          />
        ))}
      </div>
    </div>
  );
}

function NoteCard({
  note,
  boardRef,
  onUpdate,
  onDelete,
  onFocus,
}: {
  note: StickyNoteType;
  boardRef: React.RefObject<HTMLElement>;
  onUpdate: (payload: UpdateNotePayload) => void;
  onDelete: () => void;
  onFocus: () => void;
}) {
  const x = useMotionValue(note.pos_x);
  const y = useMotionValue(note.pos_y);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [localTopic, setLocalTopic] = useState(note.topic);
  const [localContent, setLocalContent] = useState(note.content);
  const colorEntry = COLORS.find((c) => c.bg === note.color) ?? COLORS[0];

  return (
    <>
      {showColorPicker && (
        <div
          className="fixed inset-0 z-[9997]"
          onClick={() => setShowColorPicker(false)}
        />
      )}

      <motion.div
        drag
        dragMomentum={false}
        dragConstraints={boardRef}
        dragElastic={0}
        style={{
          x,
          y,
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: note.z_index,
          width: 224,
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1, rotate: note.rotation }}
        whileDrag={{ scale: 1.05, rotate: 0 }}
        onDragStart={onFocus}
        onDragEnd={() => onUpdate({ id: note.id, pos_x: x.get(), pos_y: y.get() })}
        onPointerDown={onFocus}
        className="cursor-grab touch-none"
      >
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: note.color,
            border: `1px solid ${colorEntry.text}1a`,
            boxShadow:
              "0 6px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.08)",
          }}
        >
          {/* Header strip */}
          <div
            className="flex items-center justify-between px-2.5 py-2"
            style={{ backgroundColor: `${colorEntry.text}12` }}
          >
            {/* Color picker */}
            <div className="relative z-[9998]">
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColorPicker((v) => !v);
                }}
                className="p-1 rounded-md opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: colorEntry.text }}
                title="Change color"
              >
                <Palette className="h-3.5 w-3.5" />
              </button>

              {showColorPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.88, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="absolute top-full left-0 mt-1.5 p-2 rounded-xl bg-popover border border-border shadow-2xl z-[9999] flex gap-1.5"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >
                  {COLORS.map((c) => (
                    <button
                      key={c.bg}
                      onClick={() => {
                        onUpdate({ id: note.id, color: c.bg });
                        setShowColorPicker(false);
                      }}
                      className="w-5 h-5 rounded-full transition-transform hover:scale-125"
                      style={{
                        backgroundColor: c.bg,
                        border: `2px solid ${note.color === c.bg ? c.text : "transparent"}`,
                        outline:
                          note.color === c.bg ? `1px solid ${c.text}` : "none",
                        outlineOffset: 1,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            {/* Grip dots */}
            <div
              className="flex gap-[3px] opacity-20"
              style={{ color: colorEntry.text }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[3px] h-[3px] rounded-full bg-current"
                />
              ))}
            </div>

            {/* Delete */}
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 rounded-md opacity-40 hover:opacity-90 hover:bg-black/10 transition-all"
              style={{ color: colorEntry.text }}
              title="Delete note"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Topic */}
          <input
            value={localTopic}
            onChange={(e) => setLocalTopic(e.target.value)}
            onBlur={() => {
              if (localTopic !== note.topic)
                onUpdate({ id: note.id, topic: localTopic });
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full px-3 pt-3 pb-1 text-[13px] font-bold bg-transparent outline-none cursor-text placeholder:opacity-40"
            style={{ color: colorEntry.text }}
            placeholder="Topic..."
          />

          {/* Content */}
          <textarea
            value={localContent}
            onChange={(e) => setLocalContent(e.target.value)}
            onBlur={() => {
              if (localContent !== note.content)
                onUpdate({ id: note.id, content: localContent });
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full px-3 pt-1 pb-3 text-[12px] leading-relaxed bg-transparent outline-none resize-none cursor-text placeholder:opacity-40"
            style={{ color: colorEntry.text, minHeight: 96 }}
            placeholder="Write your notes here..."
          />

          {/* Footer */}
          <div
            className="px-3 pb-2.5 pt-1.5 text-[10px] opacity-35 font-medium"
            style={{
              color: colorEntry.text,
              borderTop: `1px solid ${colorEntry.text}18`,
            }}
          >
            {new Date(note.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      </motion.div>
    </>
  );
}
