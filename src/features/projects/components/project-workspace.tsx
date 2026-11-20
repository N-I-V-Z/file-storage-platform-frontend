"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/src/lib/http/api-client";
import { ApiKeyPanel } from "@/src/features/api-keys/components/api-key-panel";
import { createProject } from "../api/projects.api";
import { projectKeys } from "../api/projects.keys";
import { useProjects } from "../hooks/use-projects";
import { ProjectUsagePanel } from "./project-usage-panel";
import {
  createProjectSchema,
  type CreateProjectValues,
  type Project,
} from "../schemas/projects.schemas";

export function ProjectWorkspace({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const projectsQuery = useProjects(userId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [keyIssuing, setKeyIssuing] = useState(false);
  const createTrigger = useRef<HTMLButtonElement>(null);
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
                    onClick={() => setSelectedId(project.id)}
                  >
                    <span className="project-item-icon" aria-hidden="true">
                      ▣
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
            <p className="detail-intro">
              Theo dõi dung lượng và quản lý quyền truy cập cho project này.
            </p>
            <ProjectUsagePanel
              key={`usage-${selected.id}`}
              userId={userId}
              projectId={selected.id}
            />
            <ApiKeyPanel
              key={selected.id}
              projectId={selected.id}
              onIssuingChange={setKeyIssuing}
            />
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
