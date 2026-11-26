"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState, type KeyboardEvent } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/src/lib/http/api-client";
import { StorageIcon } from "@/src/components/ui/storage-icon";
import { ApiKeyPanel } from "@/src/features/api-keys/components/api-key-panel";
import { FileExplorer } from "@/src/features/files/components/file-explorer";
import { TrashPanel } from "@/src/features/files/components/trash-panel";
import { AuditPanel } from "@/src/features/audit/components/audit-panel";
import { createProject } from "../api/projects.api";
import { projectKeys } from "../api/projects.keys";
import { useProjects } from "../hooks/use-projects";
import { ProjectUsagePanel } from "./project-usage-panel";
import {
  createProjectSchema,
  type CreateProjectValues,
  type Project,
} from "../schemas/projects.schemas";

const projectTabs = [
  { id: "files", label: "Tệp" },
  { id: "usage", label: "Dung lượng" },
  { id: "trash", label: "Thùng rác" },
  { id: "keys", label: "API key" },
  { id: "audit", label: "Hoạt động" },
] as const;
type ProjectTab = (typeof projectTabs)[number]["id"];

export function ProjectWorkspace({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const projectsQuery = useProjects(userId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [keyIssuing, setKeyIssuing] = useState(false);
  const [activeTab, setActiveTab] = useState<ProjectTab>("files");
  const createTrigger = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<Record<ProjectTab, HTMLButtonElement | null>>({
    files: null,
    usage: null,
    trash: null,
    keys: null,
    audit: null,
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: { name: "" },
  });
  const createMutation = useMutation({
    mutationFn: (values: CreateProjectValues) => createProject(values),
    onSuccess: (project) => {
      queryClient.setQueryData<Project[]>(
        projectKeys.list(userId),
        (current = []) => [project, ...current],
      );
      setSelectedId(project.id);
      setActiveTab("files");
    },
  });

  const projects = projectsQuery.data ?? [];
  const selected =
    projects.find((project) => project.id === selectedId) ??
    projects[0] ??
    null;

  async function submit(values: CreateProjectValues) {
    if (keyIssuing) return;
    setFormError("");
    try {
      await createMutation.mutateAsync(values);
      reset();
      setCreating(false);
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Không thể tạo project. Vui lòng thử lại.",
      );
    }
  }

  function cancelCreate() {
    setCreating(false);
    setFormError("");
    reset();
    createTrigger.current?.focus();
  }

  function selectProject(projectId: string) {
    setSelectedId(projectId);
    setActiveTab("files");
  }

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const nextIndex =
      event.key === "ArrowRight"
        ? (index + 1) % projectTabs.length
        : event.key === "ArrowLeft"
          ? (index - 1 + projectTabs.length) % projectTabs.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? projectTabs.length - 1
              : -1;
    if (nextIndex < 0 || keyIssuing) return;
    event.preventDefault();
    const next = projectTabs[nextIndex].id;
    setActiveTab(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <section id="projects" className="workspace-layout" aria-label="Projects">
      <aside className="project-rail">
        <div className="rail-heading">
          <h2>Projects</h2>
          <span>{projects.length}</span>
        </div>
        {projectsQuery.isPending ? (
          <p className="rail-message" role="status">
            Đang tải project...
          </p>
        ) : null}
        {projectsQuery.isError && !projectsQuery.data ? (
          <div className="rail-message">
            <p role="alert">Không thể tải project.</p>
            <button
              type="button"
              className="text-action"
              onClick={() => void projectsQuery.refetch()}
            >
              Thử lại
            </button>
          </div>
        ) : null}
        {projectsQuery.isSuccess && projects.length === 0 ? (
          <p className="rail-message">Chưa có project nào</p>
        ) : null}
        {projects.length > 0 ? (
          <nav aria-label="Chọn project">
            <ul className="project-list">
              {projects.map((project) => (
                <li key={project.id}>
                  <button
                    type="button"
                    className="project-item"
                    aria-current={
                      selected?.id === project.id ? "true" : undefined
                    }
                    disabled={keyIssuing && selected?.id !== project.id}
                    onClick={() => selectProject(project.id)}
                  >
                    <span className="project-item-icon" aria-hidden="true">
                      <StorageIcon kind="project" />
                    </span>
                    <span>{project.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <button
          ref={createTrigger}
          type="button"
          className="button button-outline rail-create"
          disabled={keyIssuing}
          onClick={() => {
            setFormError("");
            setCreating(true);
          }}
          aria-expanded={creating}
          aria-controls="create-project-form"
        >
          <span aria-hidden="true">+</span> Tạo project
        </button>
        {creating ? (
          <form
            id="create-project-form"
            noValidate
            className="rail-form"
            onSubmit={handleSubmit(submit)}
          >
            <label htmlFor="project-name">Tên project</label>
            <input
              id="project-name"
              autoFocus
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "project-name-error" : undefined}
              {...register("name")}
            />
            {errors.name && (
              <p id="project-name-error" className="field-error" role="alert">
                {errors.name.message}
              </p>
            )}
            {formError && (
              <p className="form-error" role="alert">
                {formError}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={cancelCreate}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={createMutation.isPending || keyIssuing}
                aria-busy={createMutation.isPending}
              >
                {createMutation.isPending ? "Đang lưu..." : "Lưu project"}
              </button>
            </div>
          </form>
        ) : null}
      </aside>
      <div className="project-detail">
        <p className="sr-only" role="status">
          {selected
            ? `Project đang chọn: ${selected.name}`
            : "Chưa chọn project"}
        </p>
        {selected ? (
          <>
            <div className="detail-heading">
              <div>
                <span className="eyebrow">PROJECT ĐANG CHỌN</span>
                <h2>{selected.name}</h2>
              </div>
              <span className="project-id">ID {selected.id}</span>
            </div>
            <div
              className="project-tabs"
              role="tablist"
              aria-label={`Quản lý ${selected.name}`}
            >
              {projectTabs.map((tab, index) => (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[tab.id] = node;
                  }}
                  id={`project-tab-${tab.id}`}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls="project-tab-panel"
                  tabIndex={activeTab === tab.id ? 0 : -1}
                  disabled={keyIssuing && activeTab !== tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div
              id="project-tab-panel"
              role="tabpanel"
              aria-labelledby={`project-tab-${activeTab}`}
              className="project-tab-panel"
              tabIndex={0}
            >
              {activeTab === "files" && (
                <FileExplorer
                  key={`files-${selected.id}`}
                  userId={userId}
                  projectId={selected.id}
                />
              )}
              {activeTab === "usage" && (
                <ProjectUsagePanel
                  key={`usage-${selected.id}`}
                  userId={userId}
                  projectId={selected.id}
                />
              )}
              {activeTab === "trash" && (
                <TrashPanel
                  key={`trash-${selected.id}`}
                  userId={userId}
                  projectId={selected.id}
                />
              )}
              {activeTab === "keys" && (
                <ApiKeyPanel
                  key={selected.id}
                  projectId={selected.id}
                  onIssuingChange={setKeyIssuing}
                />
              )}
              {activeTab === "audit" && (
                <AuditPanel
                  key={`audit-${selected.id}`}
                  userId={userId}
                  projectId={selected.id}
                />
              )}
            </div>
          </>
        ) : (
          <div className="project-empty">
            <span className="coming-icon" aria-hidden="true">
              ▣
            </span>
            <h2>Không gian lưu trữ bắt đầu ở đây</h2>
            <p>Tạo project đầu tiên để quản lý API key và tệp của bạn.</p>
          </div>
        )}
      </div>
    </section>
  );
}
