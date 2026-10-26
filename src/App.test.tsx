import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('Atlas agentic travel search', () => {
  it('runs a grounded search and lets the traveler build a trip', async () => {
    const user = userEvent.setup()
    render(<App />)

    const search = screen.getByRole('textbox', { name: /describe your ideal trip/i })
    await user.clear(search)
    await user.type(search, 'peaceful romantic dinner with a sunset under €90')
    await user.click(screen.getByRole('button', { name: /search with atlas/i }))

    expect(await screen.findByText(/grounded matches ranked/i)).toBeInTheDocument()
    const firstResult = screen.getAllByTestId('result-card')[0]
    expect(within(firstResult).getByText(/traveler evidence/i)).toBeInTheDocument()

    await user.click(within(firstResult).getByRole('button', { name: /view evidence/i }))
    expect(screen.getByRole('dialog', { name: /evidence for/i })).toBeInTheDocument()
    expect(screen.getAllByText(/citation id/i).length).toBeGreaterThan(0)
    await user.click(screen.getByRole('button', { name: /close evidence/i }))

    await user.click(within(firstResult).getByRole('button', { name: /^save to trip$/i }))
    expect(screen.getByText('1 saved')).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: /trip workspace/i })).toHaveTextContent(/estimated total/i)
  })
})
