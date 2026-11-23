import type { CSSProperties, FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { LogOut, Plus, RotateCcw, Trash2 } from "lucide-react";
import { SectionHeader } from "../components/SectionHeader";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../hooks/useLanguage";
import { useSettings } from "../hooks/useSettings";
import { languages } from "../i18n";
import { supabase } from "../lib/supabase";
import type { Member } from "../types";

const fieldClass =
  "w-full border-0 border-b border-line bg-transparent py-2 text-sm text-ink outline-none transition-colors placeholder:text-muted-strong focus:border-navy";

function Panel({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 border-t border-line/70 py-9 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] sm:gap-10">
      <div>
        <h2 className="font-display text-xl font-light text-ink">{title}</h2>
        {description && (
          <p className="mt-2 text-[12px] leading-relaxed text-muted-strong">{description}</p>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

export function Settings() {
  const { t, language, setLanguage } = useLanguage();
  const { settings, update, reset } = useSettings();
  const { email, role, signOut } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  const [members, setMembers] = useState<Member[] | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberBusy, setMemberBusy] = useState(false);
  const [memberError, setMemberError] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!supabase || role !== "owner") return;
    setMemberError(false);
    const { data, error } = await supabase.rpc("list_members");
    if (error) {
      setMemberError(true);
      return;
    }
    setMembers((data ?? []) as Member[]);
  }, [role]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  const addMember = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !memberEmail.trim()) return;
    setMemberBusy(true);
    setMemberError(false);
    const { error } = await supabase.rpc("add_member", {
      p_email: memberEmail.trim().toLowerCase(),
    });
    setMemberBusy(false);
    if (error) {
      setMemberError(true);
      return;
    }
    setMemberEmail("");
    await loadMembers();
  };

  const removeMember = async (target: string) => {
    if (!supabase) return;
    setMemberError(false);
    const { error } = await supabase.rpc("remove_member", { p_email: target });
    if (error) {
      setMemberError(true);
      return;
    }
    await loadMembers();
  };

  useEffect(() => {
    if (!confirming) return;
    const id = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(id);
  }, [confirming]);

  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => setDone(false), 3200);
    return () => window.clearTimeout(id);
  }, [done]);

  const handleReset = () => {
    if (confirming) {
      reset();
      setConfirming(false);
      setDone(true);
    } else {
      setConfirming(true);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
      <SectionHeader
        eyebrow={t.settings.eyebrow}
        title={t.settings.title}
        jp="設定"
        description={t.settings.description}
        aside={<span className="label">{t.settings.autoSave}</span>}
      />

      <div className="mt-4">
        <Panel title={t.settings.accountTitle} description={t.settings.accountDesc}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate font-mono text-[12px] tracking-[0.04em] text-navy">
                {email}
              </p>
              <p className="label mt-1.5">
                {role === "owner" ? t.settings.roleOwner : t.settings.roleMember}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-2 border border-line px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-navy/70 transition-colors hover:border-navy/40 hover:text-ink"
            >
              <LogOut size={12} strokeWidth={1.5} aria-hidden="true" />
              {t.settings.signOut}
            </button>
          </div>
        </Panel>

        {role === "owner" && (
          <Panel title={t.settings.peopleTitle} description={t.settings.peopleDesc}>
            <div>
              <ul className="divide-y divide-line/60 border-y border-line/60">
                {members === null && !memberError && (
                  <li className="py-3 text-[12px] text-muted-strong">{t.common.loading}…</li>
                )}
                {members === null && memberError && (
                  <li className="py-3 text-[12px] text-muted-strong">—</li>
                )}
                {members?.map((member) => (
                  <li
                    key={member.email}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-[12px] text-navy">
                        {member.email}
                        {member.email === email && (
                          <span className="ml-2 font-sans text-[9px] uppercase tracking-[0.16em] text-muted-strong">
                            ({t.settings.you})
                          </span>
                        )}
                      </span>
                      <span className="label mt-1 block text-[9px]">
                        {member.role === "owner"
                          ? t.settings.roleOwner
                          : t.settings.roleMember}
                      </span>
                    </span>
                    {member.role !== "owner" && (
                      <button
                        type="button"
                        onClick={() => void removeMember(member.email)}
                        className="btn-quiet hover:text-ember"
                      >
                        <Trash2 size={12} strokeWidth={1.5} aria-hidden="true" />
                        {t.settings.peopleRemove}
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              <form onSubmit={addMember} className="mt-5 flex flex-wrap items-end gap-3">
                <div className="min-w-[200px] flex-1">
                  <label htmlFor="member-email" className="label block">
                    {t.settings.peopleEmailLabel}
                  </label>
                  <input
                    id="member-email"
                    type="email"
                    autoComplete="off"
                    value={memberEmail}
                    placeholder={t.settings.peoplePlaceholder}
                    onChange={(event) => setMemberEmail(event.target.value)}
                    className={`${fieldClass} mt-2`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={memberBusy || !memberEmail.trim()}
                  className="inline-flex items-center gap-2 border border-navy/70 px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] text-navy transition-colors hover:bg-navy hover:text-mist disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Plus size={12} strokeWidth={1.5} aria-hidden="true" />
                  {memberBusy ? t.settings.peopleAdding : t.settings.peopleAdd}
                </button>
              </form>

              <p className="label mt-4 text-[9px]">{t.settings.peopleHint}</p>
              {memberError && (
                <p role="alert" className="mt-2 text-[11px] text-ember">
                  {t.settings.peopleError}
                </p>
              )}
            </div>
          </Panel>
        )}

        <Panel title={t.settings.languageTitle} description={t.settings.languageDesc}>
          <div className="grid gap-2 sm:grid-cols-3">
            {languages.map((option) => {
              const active = language === option.code;
              return (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => setLanguage(option.code)}
                  aria-pressed={active}
                  className={`group border px-4 py-3 text-left transition-colors ${
                    active
                      ? "border-navy bg-white/60"
                      : "border-line/80 hover:border-navy/35 hover:bg-white/30"
                  }`}
                >
                  <span className="flex items-center justify-between">
                    <span className="label">{option.short}</span>
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full ${
                        active ? "bg-ember" : "bg-line"
                      }`}
                    />
                  </span>
                  <span className="mt-2 block font-display text-base font-light text-ink">
                    {option.name}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title={t.settings.audioTitle} description={t.settings.audioDesc}>
          <div className="flex items-center gap-4">
            <label htmlFor="settings-volume" className="label shrink-0">
              {t.settings.volume}
            </label>
            <input
              id="settings-volume"
              type="range"
              className="range"
              min={0}
              max={1}
              step={0.01}
              value={settings.volume}
              onChange={(event) => update({ volume: Number(event.target.value) })}
              style={{ "--fill": `${settings.volume * 100}%` } as CSSProperties}
            />
            <span className="w-9 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-strong">
              {Math.round(settings.volume * 100)}
            </span>
          </div>
        </Panel>

        <Panel title={t.settings.privacyTitle}>
          <p className="text-[12.5px] leading-relaxed text-muted-strong">{t.settings.privacyBody}</p>
        </Panel>

        <div className="border-t border-line/70 py-9">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={handleReset}
              className={`inline-flex items-center gap-2 border px-4 py-2.5 text-[10px] uppercase tracking-[0.18em] transition-colors ${
                confirming
                  ? "border-ember bg-ember text-mist hover:bg-ember/90"
                  : "border-line text-navy/70 hover:border-navy/40 hover:text-ink"
              }`}
            >
              <RotateCcw size={12} strokeWidth={1.5} aria-hidden="true" />
              {confirming ? t.settings.resetConfirm : t.settings.reset}
            </button>
            <p aria-live="polite" className="text-[11px] text-muted-strong">
              {done ? t.settings.resetDone : t.settings.autoSave}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
