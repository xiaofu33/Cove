/** Composer：输入面板、双层底座、新对话项目/工作树顶栏、模式与发送状态测试。 */

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import Composer from './Composer'

describe('Composer', () => {
  it('渲染中文任务指令占位符、Direct / Plan 模式和发送按钮', () => {
    const html = renderToStaticMarkup(
      <Composer disabled={false} mode="normal" onModeChange={() => {}} onSend={async () => {}} />,
    )
    expect(html).toContain('输入任务指令，@ 引用文件，/ 调用命令')
    expect(html).toContain('Direct')
    expect(html).toContain('Plan')
    expect(html).toContain('aria-label="发送"')
    expect(html).toContain('aria-pressed="true"')
  })

  it('新对话未发送消息时（messages.length === 0）渲染双层浅灰底座与「项目 + 工作树」顶栏', () => {
    const html = renderToStaticMarkup(
      <Composer
        disabled={false}
        hasMessages={false}
        workspacePath="/Users/alice/cove-desktop"
        onSend={async () => {}}
      />,
    )
    expect(html).toContain('composer-outer-ring--new')
    expect(html).toContain('composer__meta-bar')
    expect(html).toContain('cove-desktop')
    expect(html).toContain('composer__top-worktree-name')
    expect(html).toContain('main')
    expect(html).toContain('composer-inner-box--new')
  })

  it('新对话未指定工作区时顶栏默认展示 No Project', () => {
    const html = renderToStaticMarkup(
      <Composer
        disabled={false}
        hasMessages={false}
        onSend={async () => {}}
      />,
    )
    expect(html).toContain('No Project')
  })

  it('已发送消息后（messages.length > 0）自动收起外层底座并隐藏顶部选择栏', () => {
    const html = renderToStaticMarkup(
      <Composer
        disabled={false}
        hasMessages={true}
        onSend={async () => {}}
      />,
    )
    expect(html).toContain('composer-outer-ring--chat')
    expect(html).not.toContain('composer__meta-bar')
    expect(html).toContain('composer-inner-box--chat')
  })

  it('Plan 模式可见且有草稿时发送按钮可用', () => {
    const html = renderToStaticMarkup(
      <Composer
        disabled={false}
        mode="plan"
        value="Inspect the repository"
        onModeChange={() => {}}
        onSend={async () => {}}
      />,
    )
    expect(html).toContain('>Inspect the repository</textarea>')
    expect(html).toContain('mode-switch__item active')
    expect(html).not.toContain('composer__send" disabled')
  })

  it('发送中锁定输入并展示发送状态', () => {
    const html = renderToStaticMarkup(
      <Composer disabled={false} sending value="Work" onSend={async () => {}} />,
    )
    expect(html).toContain('composer--busy')
    expect(html).toContain('aria-label="正在发送"')
    expect(html).toContain('disabled=""')
  })

  it('run 执行中发送按钮转为暂停按钮，点击触发 onStop', () => {
    const html = renderToStaticMarkup(
      <Composer
        disabled={false}
        running
        onStop={() => {}}
        onSend={async () => {}}
      />,
    )
    expect(html).toContain('composer__stop')
    expect(html).toContain('aria-label="暂停"')
    expect(html).not.toContain('aria-label="发送"')
    expect(html).not.toContain('composer__send" disabled')
  })

  it('输入框 footer 不渲染 ⌘K 入口（快捷键仍保留触发面板）', () => {
    const html = renderToStaticMarkup(
      <Composer
        disabled={false}
        onSend={async () => {}}
        commands={[
          { id: 'stop', label: 'Stop Run', icon: 'close', onSelect: () => {} },
          { id: 'runs', label: 'View current Run', icon: 'runs', onSelect: () => {} },
        ]}
      />,
    )
    expect(html).not.toContain('composer__cmd')
    expect(html).not.toContain('⌘K')
    expect(html).not.toContain('composer-commands__item')
  })

  it('消息输入框具备无障碍名称与自适应行配置', () => {
    const html = renderToStaticMarkup(
      <Composer disabled={false} onSend={async () => {}} />,
    )
    expect(html).toContain('aria-label="消息输入框"')
    expect(html).toContain('rows="1"')
  })

  it('本地适配：默认展示本地 Provider 模型（Qwen Plus）与英文模式标签（Direct），且无模式图标', () => {
    const html = renderToStaticMarkup(
      <Composer disabled={false} mode="normal" onSend={async () => {}} />,
    )
    expect(html).toContain('Qwen')
    expect(html).toContain('Plus')
    expect(html).toContain('Direct')
    expect(html).not.toContain('composer__mode-shield')
  })

  it('本地适配：Plan 模式展示纯英文 Plan 标签且无图标', () => {
    const html = renderToStaticMarkup(
      <Composer disabled={false} mode="plan" onSend={async () => {}} />,
    )
    expect(html).toContain('Plan')
    expect(html).not.toContain('composer__mode-shield')
  })

  it('本地适配：传入 modelSettings 时正确响应激活的本地 Provider', () => {
    const mockModelSettings = {
      default_provider: 'deepseek' as const,
      active_provider: 'deepseek',
      active_model: 'deepseek-chat',
      providers: [
        {
          provider: 'deepseek' as const,
          label: 'DeepSeek',
          model: 'deepseek-chat',
          base_url: null,
          api_style: 'chat_completions' as const,
          configured: true,
          key_source: 'environment' as const,
        },
      ],
      reflection: { enabled: true, inherit_main: true, provider: null, model: null },
      maintenance: { enabled: false, inherit_main: true, provider: null, model: null },
      summary: { enabled: true, inherit_main: false, provider: 'deepseek' as const, model: 'deepseek-chat' },
      active_roles: {
        main: { enabled: true, provider: 'deepseek', model: 'deepseek-chat' },
        summary: { enabled: true, provider: 'deepseek', model: 'deepseek-chat' },
        reflection: { enabled: true, provider: 'deepseek', model: 'deepseek-chat' },
        maintenance: { enabled: false, provider: null, model: null },
      },
      restart_required: false,
      restart_supported: true,
      restart_blocked_by_run_ids: [],
      can_restart: true,
    }
    const html = renderToStaticMarkup(
      <Composer
        disabled={false}
        modelSettings={mockModelSettings}
        onSend={async () => {}}
      />,
    )
    expect(html).toContain('DeepSeek')
    expect(html).toContain('V3')
  })
})
