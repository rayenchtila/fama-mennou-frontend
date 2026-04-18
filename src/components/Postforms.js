// components/PostForms.jsx
// Contains: PostJobModal, PostCourseModal, PostClientModal
import { useState } from "react";
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
    <Modal open={open} onClose={onClose} title="Post a Job" subtitle="Reach thousands of qualified candidates" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Job title" placeholder="e.g. Senior React Developer" value={form.title} onChange={set("title")} required />
          <Input label="Company name" placeholder="Your company" value={form.company} onChange={set("company")} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Location" placeholder="e.g. Remote, Paris" value={form.location} onChange={set("location")} />
          <Input label="Salary range" placeholder="e.g. $60k–$90k" value={form.salary} onChange={set("salary")} />
        </div>
        <Select
          label="Job type"
          value={form.type}
          onChange={set("type")}
          options={["Full-time", "Part-time", "Contract", "Freelance", "Internship"]}
        />
        <Textarea
          label="Job description"
          placeholder="Describe the role, responsibilities, and requirements…"
          value={form.description}
          onChange={set("description")}
          required
          rows={5}
        />
        <Input
          label="Skills / Tags"
          placeholder="React, TypeScript, Node.js (comma separated)"
          value={form.tags}
          onChange={set("tags")}
          hint="Separate multiple tags with commas"
        />
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setForm(f => ({ ...f, remote: !f.remote }))}
            className={["relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer", form.remote ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"].join(" ")}
          >
            <div className={["absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200", form.remote ? "left-5" : "left-0.5"].join(" ")} />
          </div>
          <span className="text-sm text-slate-700 dark:text-slate-300">Remote-friendly position</span>
        </label>
      </div>
 
      <div className="flex gap-3 mt-6">
        <Button variant="secondary" size="md" fullWidth onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" fullWidth loading={loading} onClick={submit}>Post Job</Button>
      </div>
    </Modal>
  );
}
 
// ── Post Course Modal ────────────────────────────────────────
export function PostCourseModal({ open, onClose, onSubmit }) {
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
    <Modal open={open} onClose={onClose} title="Share a Course" subtitle="Teach your skills to thousands of learners" size="lg">
      <div className="space-y-4">
        <Input label="Course title" placeholder="e.g. Advanced React Patterns" value={form.title} onChange={set("title")} required />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Category" value={form.category} onChange={set("category")} options={["Development","Design","Marketing","Writing","SEO","Video","Business"]} />
          <Select label="Level" value={form.level} onChange={set("level")} options={["Beginner","Intermediate","Advanced"]} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Price (USD)" placeholder="0 for free" value={form.price} onChange={set("price")} type="number" hint="Leave 0 for free course" />
          <Input label="Duration" placeholder="e.g. 8h 30min" value={form.duration} onChange={set("duration")} />
        </div>
        <Input label="Number of lessons" placeholder="e.g. 24" value={form.lessons} onChange={set("lessons")} type="number" />
        <Textarea label="Course description" placeholder="What will students learn? Who is this for?" value={form.description} onChange={set("description")} rows={4} required />
      </div>
 
      <div className="flex gap-3 mt-6">
        <Button variant="secondary" size="md" fullWidth onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" fullWidth loading={loading} onClick={submit}>Publish Course</Button>
      </div>
    </Modal>
  );
}
 
// ── Post Client Brief Modal ─────────────────────────────────
export function PostClientModal({ open, onClose, onSubmit }) {
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
    <Modal open={open} onClose={onClose} title="Post a Project" subtitle="Get proposals from top freelancers fast" size="lg">
      <div className="space-y-4">
        <Input label="Project title" placeholder="e.g. Build an e-commerce website" value={form.title} onChange={set("title")} required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Budget" placeholder="e.g. $500–$2000" value={form.budget} onChange={set("budget")} />
          <Input label="Deadline" placeholder="e.g. 2 weeks" value={form.deadline} onChange={set("deadline")} />
        </div>
        <Select label="Category" value={form.category} onChange={set("category")} options={["Development","Design","Marketing","Writing","SEO","Video","Other"]} />
        <Input
          label="Required skills"
          placeholder="React, Figma, SEO (comma separated)"
          value={form.skills}
          onChange={set("skills")}
        />
        <Textarea label="Project description" placeholder="Describe your project in detail — goals, deliverables, tech stack…" value={form.description} onChange={set("description")} rows={5} required />
      </div>
 
      <div className="flex gap-3 mt-6">
        <Button variant="secondary" size="md" fullWidth onClick={onClose}>Cancel</Button>
        <Button variant="primary" size="md" fullWidth loading={loading} onClick={submit}>Post Project</Button>
      </div>
    </Modal>
  );
}