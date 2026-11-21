import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from './Home'

it('shows the title and detects the backend', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <Home />
    </QueryClientProvider>,
  )

  expect(
    screen.getByRole('heading', { name: /placement preparation tracker/i }),
  ).toBeInTheDocument()
  expect(await screen.findByText(/backend reachable/i)).toBeInTheDocument()
})