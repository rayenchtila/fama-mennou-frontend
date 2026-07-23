// components/PostForms.jsx
// Contains: PostJobModal, PostCourseModal, PostClientModal
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";
 
// ── Shared textarea ──────────────────────────────────────────
function Textarea({ label, placeholder, value, onChange, error, required, rows = 4 }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
          {label}
          {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <textarea
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={[
          "w-full px-4 py-3 rounded-xl border transition-all duration-200 resize-none",
          "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100",
          "placeholder-slate-400 dark:placeholder-slate-600",
          "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
          error
            ? "border-rose-400 dark:border-rose-600"
            : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
          "text-sm",
        ].join(" ")}
      />
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  );
}
 
function Select({ label, options, value, onChange, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
          {label}{required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
      >
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
    </div>
  );
}
 
// ── Post Job Modal ───────────────────────────────────────────
export function PostJobModal({ open, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: "", company: "", location: "", salary: "",
    type: "Full-time", description: "", tags: "", remote: false,
  });
  const [loading, setLoading] = useState(false);
 
  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }
 
  function submit() {
    if (!form.title || !form.company) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmit?.({ ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), id: Date.now() });
      onClose?.();
    }, 1000);
  }
 
  return (
    <Modal open={open} onClose={onClose} title={t("postjob.title")} subtitle={t("postjob.subtitle")} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t("postjob.job_title")} placeholder={t("postjob.job_title_ph")} value={form.title} onChange={set("title")} required />
          <Input label={t("postjob.company")} placeholder={t("postjob.company_ph")} value={form.company} onChange={set("company")} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t("postjob.location")} placeholder={t("postjob.location_ph")} value={form.location} onChange={set("location")} />
          <Input label={t("postjob.salary")} placeholder={t("postjob.salary_ph")} value={form.salary} onChange={set("salary")} />
        </div>
        <Select
          label={t("postjob.job_type")}
          value={form.type}
          onChange={set("type")}
          options={["Full-time", "Part-time", "Contract", "Freelance", "Internship"].map(o => ({ value: o, label: t(o) }))}
        />
        <Textarea
          label={t("postjob.description")}
          placeholder={t("postjob.description_ph")}
          value={form.description}
          onChange={set("description")}
          required
          rows={5}
        />
        <Input
          label={t("postjob.tags")}
          placeholder={t("postjob.tags_ph")}
          value={form.tags}
          onChange={set("tags")}
          hint={t("postjob.tags_hint")}
        />
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setForm(f => ({ ...f, remote: !f.remote }))}
            className={["relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer", form.remote ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"].join(" ")}
          >
            <div className={["absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200", form.remote ? "left-5" : "left-0.5"].join(" ")} />
          </div>
          <span className="text-sm text-slate-700 dark:text-slate-300">{t("postjob.remote_friendly")}</span>
        </label>
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="secondary" size="md" fullWidth onClick={onClose}>{t("post.cancel")}</Button>
        <Button variant="primary" size="md" fullWidth loading={loading} onClick={submit}>{t("postjob.submit")}</Button>
      </div>
    </Modal>
  );
}
 
// ── Post Course Modal ────────────────────────────────────────
export function PostCourseModal({ open, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: "", category: "Development", level: "Beginner",
    price: "", description: "", duration: "", lessons: "",
  });
  const [loading, setLoading] = useState(false);
 
  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }
 
  function submit() {
    if (!form.title) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmit?.({
        ...form,
        price: form.price === "" || form.price === "0" ? 0 : parseFloat(form.price),
        students: 0, rating: 0, id: Date.now(), img: "📚",
      });
      onClose?.();
    }, 1000);
  }
 
  return (
    <Modal open={open} onClose={onClose} title={t("postcourse.title")} subtitle={t("postcourse.subtitle")} size="lg">
      <div className="space-y-4">
        <Input label={t("postcourse.course_title")} placeholder={t("postcourse.course_title_ph")} value={form.title} onChange={set("title")} required />
        <div className="grid grid-cols-2 gap-4">
          <Select label={t("postcourse.category")} value={form.category} onChange={set("category")} options={["Development","Design","Marketing","Writing","SEO","Video","Business"].map(c => ({ value: c, label: t(c) }))} />
          <Select label={t("postcourse.level")} value={form.level} onChange={set("level")} options={["Beginner","Intermediate","Advanced"].map(l => ({ value: l, label: t(l) }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label={t("postcourse.price")} placeholder={t("postcourse.price_ph")} value={form.price} onChange={set("price")} type="number" hint={t("postcourse.price_hint")} />
          <Input label={t("postcourse.duration")} placeholder={t("postcourse.duration_ph")} value={form.duration} onChange={set("duration")} />
        </div>
        <Input label={t("postcourse.lessons")} placeholder={t("postcourse.lessons_ph")} value={form.lessons} onChange={set("lessons")} type="number" />
        <Textarea label={t("postcourse.description")} placeholder={t("postcourse.description_ph")} value={form.description} onChange={set("description")} rows={4} required />
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="secondary" size="md" fullWidth onClick={onClose}>{t("post.cancel")}</Button>
        <Button variant="primary" size="md" fullWidth loading={loading} onClick={submit}>{t("postcourse.submit")}</Button>
      </div>
    </Modal>
  );
}
 
// ── Post Client Brief Modal ─────────────────────────────────
export function PostClientModal({ open, onClose, onSubmit }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    title: "", budget: "", category: "Development",
    deadline: "", description: "", skills: "",
  });
  const [loading, setLoading] = useState(false);
 
  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }
 
  function submit() {
    if (!form.title || !form.description) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmit?.({ ...form, skills: form.skills.split(",").map(s => s.trim()).filter(Boolean), id: Date.now() });
      onClose?.();
    }, 1000);
  }
 
  return (
    <Modal open={open} onClose={onClose} title={t("postproject.title")} subtitle={t("postproject.subtitle")} size="lg">
      <div className="space-y-4">
        <Input label={t("postproject.project_title")} placeholder={t("postproject.project_title_ph")} value={form.title} onChange={set("title")} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label={t("postproject.budget")} placeholder={t("postproject.budget_ph")} value={form.budget} onChange={set("budget")} />
          <Input label={t("postproject.deadline")} placeholder={t("postproject.deadline_ph")} value={form.deadline} onChange={set("deadline")} />
        </div>
        <Select label={t("postcourse.category")} value={form.category} onChange={set("category")} options={["Development","Design","Marketing","Writing","SEO","Video","Other"].map(c => ({ value: c, label: t(c) }))} />
        <Input
          label={t("postproject.skills")}
          placeholder={t("postproject.skills_ph")}
          value={form.skills}
          onChange={set("skills")}
        />
        <Textarea label={t("postproject.description")} placeholder={t("postproject.description_ph")} value={form.description} onChange={set("description")} rows={5} required />
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="secondary" size="md" fullWidth onClick={onClose}>{t("post.cancel")}</Button>
        <Button variant="primary" size="md" fullWidth loading={loading} onClick={submit}>{t("postproject.submit")}</Button>
      </div>
    </Modal>
  );
}