"use client";

import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Chip,
  Divider,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/SiteShell";

const STORAGE_KEY = "suggestions-list";
const REVIEWERS_KEY = "suggestions-reviewers";

export default function SuggestionsPage() {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [detail, setDetail] = useState("");
  const [source, setSource] = useState("");
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [list, setList] = useState<
    {
      title: string;
      type: string;
      detail: string;
      source: string;
      date: string;
      name?: string;
      anonymous?: boolean;
    }[]
  >(() => {
    if (typeof window === "undefined") return [];
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });
  const [reviewers, setReviewers] = useState<{ name: string; date: string }[]>(
    () => {
      if (typeof window === "undefined") return [];
      const savedReviewers = window.localStorage.getItem(REVIEWERS_KEY);
      if (!savedReviewers) return [];
      try {
        return JSON.parse(savedReviewers);
      } catch {
        return [];
      }
    }
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, [list]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(REVIEWERS_KEY, JSON.stringify(reviewers));
  }, [reviewers]);

  function handleSubmit() {
    if (!title.trim() || !detail.trim()) return;
    setList((prev) => [
      {
        title: title.trim(),
        type: type || "general",
        detail: detail.trim(),
        source: source.trim(),
        date: new Date().toLocaleDateString(),
        name: anonymous ? "" : name.trim(),
        anonymous,
      },
      ...prev,
    ]);
    setTitle("");
    setType("");
    setDetail("");
    setSource("");
    setName("");
    setAnonymous(false);
  }

  function handleAddReviewer(suggestionName?: string) {
    const cleanName = (suggestionName || "").trim();
    if (!cleanName) return;
    setReviewers((prev) => {
      if (prev.some((item) => item.name.toLowerCase() === cleanName.toLowerCase())) {
        return prev;
      }
      return [{ name: cleanName, date: new Date().toLocaleDateString() }, ...prev];
    });
  }

  return (
    <SiteShell motif="suggestions" mainClassName="max-w-5xl">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="site-chip">
            suggestions
          </Chip>
          <h1 className="site-section-title font-semibold">
            share improvements and content requests
          </h1>
          <p className="site-copy font-[family-name:var(--font-manrope)]">
            Drop ideas, corrections, or new sections here so we can prioritize
            updates quickly.
          </p>
          <p className="site-copy-sm">
            Credits will be given to verified contributors.
          </p>
          <p className="site-copy-sm">
            We rely on credible sources to expand and enhance our content — this is of
            utmost importance for continuous improvement initiatives.
          </p>
        </motion.section>

        <Card className="site-panel">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="site-eyebrow">
              reviewers
            </p>
            <h2 className="site-section-heading font-semibold">
              verified contributors
            </h2>
          </CardHeader>
          <Divider className="site-divider" />
          <CardBody className="flex flex-col gap-3 text-sm text-slate-300">
            {reviewers.length === 0 ? (
              <p>No reviewers yet. Verify a suggestion to add them.</p>
            ) : (
              reviewers.map((reviewer, index) => (
                <div
                  key={`${reviewer.name}-${index}`}
                  className="site-panel-soft rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">
                      {reviewer.name}
                    </p>
                    <span className="text-xs text-slate-400">{reviewer.date}</span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-sky-300">
                    verified reviewer
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card className="site-panel">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="site-eyebrow">New suggestion</p>
            <h2 className="site-section-heading font-semibold">
              what should we change next?
            </h2>
          </CardHeader>
          <Divider className="site-divider" />
          <CardBody className="flex flex-col gap-4">
            <Input
              label="name (optional)"
              labelPlacement="outside"
              placeholder="your name or lab"
              value={name}
              onValueChange={setName}
              isDisabled={anonymous}
            />
            <Checkbox
              isSelected={anonymous}
              onValueChange={setAnonymous}
              classNames={{ label: "Text-sm text-zinc-600" }}
            >
              submit anonymously
            </Checkbox>
            <Input
              label="title"
              labelPlacement="outside"
              placeholder="e.g., add linker section for AOC"
              value={title}
              onValueChange={setTitle}
            />
            <Select label="type" labelPlacement="outside" selectedKeys={type ? [type] : []} onSelectionChange={(keys) => setType(Array.from(keys)[0]?.toString() ?? "")}>
              {["content", "expansion", "layout", "data", "correction", "other"].map((item) => (
                <SelectItem key={item}>{item}</SelectItem>
              ))}
            </Select>
            <Textarea
              label="details"
              labelPlacement="outside"
              placeholder="what exactly should be updated?"
              value={detail}
              onValueChange={setDetail}
              minRows={3}
            />
            <Input
              label="source (optional)"
              labelPlacement="outside"
              placeholder="paper, database, or link"
              value={source}
              onValueChange={setSource}
            />
            <Button className="w-fit bg-sky-500 text-slate-950 font-medium" radius="full" onPress={handleSubmit}>
              submit suggestion
            </Button>
          </CardBody>
        </Card>

        <Card className="site-panel">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="site-eyebrow">Queue</p>
            <h2 className="site-section-heading font-semibold">
              suggestions backlog
            </h2>
          </CardHeader>
          <Divider className="site-divider" />
          <CardBody className="flex flex-col gap-4 text-sm text-slate-300">
            {list.length === 0 ? (
              <p>No suggestions yet. Add the first one above.</p>
            ) : (
              list.map((item, index) => (
                <div key={`${item.title}-${index}`} className="site-panel-soft rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <span className="text-xs text-slate-400">{item.date}</span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-sky-300">{item.type}</p>
                  <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>
                      submitted by:{" "}
                      {item.anonymous ? "anonymous" : item.name || "anonymous"}
                    </span>
                    {!item.anonymous && item.name ? (
                      <Button
                        size="sm"
                        radius="full"
                        className="border border-sky-400/20 bg-sky-500/12 text-sky-200"
                        onPress={() => handleAddReviewer(item.name)}
                      >
                        add as reviewer
                      </Button>
                    ) : null}
                  </div>
                  {item.source ? (
                    <p className="mt-2 text-xs text-sky-300">Source: {item.source}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardBody>
        </Card>
    </SiteShell>
  );
}
