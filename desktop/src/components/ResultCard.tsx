/**
 * 统一 Artifact 交付卡片 (ResultCard)
 * 遵循 Codex 风格与 Apple HIG 规范：卡片呈现文件类型、大小与安全操作入口，
 * 交互控件热区达到标准尺寸 (≥ 28×28pt)。
 */

import type { ReactElement } from 'react'
import { buildArtifactDownloadUrl } from '../api/artifacts'
import type { Artifact } from '../api/artifacts'
import { Icon } from './Icon'

function formatBytes(bytes: number): string {
  if (!bytes) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface ResultCardProps {
  artifact: Artifact
}

export default function ResultCard({ artifact }: ResultCardProps): ReactElement {
  const isFile = artifact.kind === 'file'
  const href = isFile
    ? buildArtifactDownloadUrl(artifact.id)
    : (artifact.source_url ?? '#')

  const openUrl = (): void => {
    if (!artifact.source_url) return
    if (window.vesta) {
      void window.vesta.openExternal(artifact.source_url)
      return
    }
    window.open(artifact.source_url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="result-card" data-testid="result-card" aria-label={`交付成果: ${artifact.title || artifact.filename || '产物'}`}>
      <div className="result-card__heading">
        <span className="result-card__icon" aria-hidden="true">
          <Icon name="file" size={18} />
        </span>
        <div className="result-card__identity">
          <div className="result-card__title">
            {artifact.title || artifact.filename || '交付物'}
          </div>
          <div className="result-card__filename mono">
            {artifact.filename || artifact.source_url || artifact.kind}
          </div>
        </div>
      </div>
      {artifact.description ? (
        <div className="result-card__desc">{artifact.description}</div>
      ) : null}
      <div className="result-card__meta">
        <span className="mono">
          {artifact.mime_type || artifact.kind}
        </span>
        <span>{formatBytes(artifact.size_bytes)}</span>
      </div>
      <div className="result-card__actions">
        {isFile ? (
          <>
            <a
              className="btn btn-ghost btn-sm result-card__btn"
              href={href}
              target="_blank"
              rel="noreferrer"
              title="在系统默认应用中打开"
            >
              <Icon name="external" size={13} />
              <span>打开</span>
            </a>
            <a
              className="btn btn-ghost btn-sm result-card__btn"
              href={href}
              download={artifact.filename ?? undefined}
              title="下载文件到本地"
            >
              <Icon name="download" size={13} />
              <span>下载</span>
            </a>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-ghost btn-sm result-card__btn"
            onClick={openUrl}
            title="在新标签页中打开外部链接"
          >
            <Icon name="external" size={13} />
            <span>打开链接</span>
          </button>
        )}
      </div>
    </div>
  )
}
