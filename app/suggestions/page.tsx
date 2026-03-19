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
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";

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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,#f7f7ff_0%,#eef2ff_35%,#e8f4ff_65%,#f8fafc_100%)] text-zinc-900">
      <Navbar className="bg-transparent backdrop-blur-md border-b border-white/40">
        <NavbarBrand className="gap-2">
          <BrandLogo />
        </NavbarBrand>
        <NavbarContent justify="end" className="gap-4">
          {[
            { label: "home", href: "/" },
            { label: "vision", href: "/vision" },
            { label: "design", href: "/design" },
            { label: "suggestions", href: "/suggestions" },
          ].map((item) => (
            <NavbarItem key={item.label}>
              <Link href={item.href} className="text-sm text-zinc-600">
                {item.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>
      </Navbar>

      <main className="relative mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 pb-20 pt-12">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-5"
        >
          <Chip className="w-fit bg-white/70 text-sky-700 border border-sky-200">
            suggestions
          </Chip>
          <h1 className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-space-grotesk)]">
            share improvements and content requests
          </h1>
          <p className="text-lg text-zinc-600 font-[family-name:var(--font-manrope)]">
            Drop ideas, corrections, or new sections here so we can prioritize
            updates quickly.
          </p>
          <p className="text-sm text-zinc-500">
            Credits will be given to verified contributors.
          </p>
          <p className="text-sm text-zinc-500">
            We rely on credible sources to expand and enhance our content — this is of
            utmost importance for continuous improvement initiatives.
          </p>
        </motion.section>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">
              reviewers
            </p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              verified contributors
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-3 text-sm text-zinc-600">
            {reviewers.length === 0 ? (
              <p>no reviewers yet — verify a suggestion to add them.</p>
            ) : (
              reviewers.map((reviewer, index) => (
                <div
                  key={`${reviewer.name}-${index}`}
                  className="rounded-2xl border border-white/70 bg-white/60 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-900">
                      {reviewer.name}
                    </p>
                    <span className="text-xs text-zinc-500">{reviewer.date}</span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-sky-500">
                    verified reviewer
                  </p>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">new suggestion</p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              what should we change next?
            </h2>
          </CardHeader>
          <Divider />
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
              classNames={{ label: "text-sm text-zinc-600" }}
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
            <Button className="bg-sky-600 text-white w-fit" radius="full" onPress={handleSubmit}>
              submit suggestion
            </Button>
          </CardBody>
        </Card>

        <Card className="bg-white/70 border border-white/80">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500 font-medium">queue</p>
            <h2 className="text-2xl font-semibold font-[family-name:var(--font-space-grotesk)]">
              suggestions backlog
            </h2>
          </CardHeader>
          <Divider />
          <CardBody className="flex flex-col gap-4 text-sm text-zinc-600">
            {list.length === 0 ? (
              <p>no suggestions yet — add the first one above.</p>
            ) : (
              list.map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-2xl border border-white/70 bg-white/60 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                    <span className="text-xs text-zinc-500">{item.date}</span>
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-sky-500 mt-1">{item.type}</p>
                  <p className="mt-2 text-sm text-zinc-600">{item.detail}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span>
                      submitted by:{" "}
                      {item.anonymous ? "anonymous" : item.name || "anonymous"}
                    </span>
                    {!item.anonymous && item.name ? (
                      <Button
                        size="sm"
                        radius="full"
                        className="bg-white border border-sky-200 text-sky-700"
                        onPress={() => handleAddReviewer(item.name)}
                      >
                        add as reviewer
                      </Button>
                    ) : null}
                  </div>
                  {item.source ? (
                    <p className="mt-2 text-xs text-sky-700">source: {item.source}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
