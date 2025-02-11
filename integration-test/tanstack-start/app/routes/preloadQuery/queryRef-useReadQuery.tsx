import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/preloadQuery/queryRef-useReadQuery')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/preloadQuery/queryRef-useReadQuery"!</div>
}
