import * as React from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Bell, Heart, MessageCircle } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { ScrollArea } from "./ui/scroll-area"
import { UserAvatar } from "./UserAvatar"
import { cn } from "@/lib/utils"

interface NotificationActor {
  id: number
  nome: string
  photoUrl: string | null
}

interface NotificationItem {
  id: number
  type: "like" | "comment"
  receitaId: number | null
  comentarioId: number | null
  isRead: boolean
  createdAt: string
  actor: NotificationActor | null
  receita: { id: number; titulo: string; urlImagem: string | null } | null
  comentarioTexto: string | null
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return "agora"
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(dateStr).toLocaleDateString("pt-BR")
}

interface Props {
  onOpenRecipe?: (id: number) => void
}

export function NotificationBell({ onOpenRecipe }: Props) {
  const [open, setOpen] = React.useState(false)
  const queryClient = useQueryClient()

  const { data: countData } = useQuery<{ count: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const r = await fetch("/api/notificacoes/unread-count")
      if (!r.ok) throw new Error("erro")
      return r.json()
    },
    refetchInterval: 20000,
  })

  const { data: items = [], isLoading } = useQuery<NotificationItem[]>({
    queryKey: ["notifications", "list"],
    queryFn: async () => {
      const r = await fetch("/api/notificacoes")
      if (!r.ok) throw new Error("erro")
      return r.json()
    },
    enabled: open,
  })

  const readAll = useMutation({
    mutationFn: async () => {
      await fetch("/api/notificacoes/read-all", { method: "POST" })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/notificacoes/${id}/read`, { method: "POST" })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const unread = countData?.count ?? 0

  const handleClick = (n: NotificationItem) => {
    if (!n.isRead) markRead.mutate(n.id)
    if (n.receitaId && onOpenRecipe) {
      onOpenRecipe(n.receitaId)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-xl hover:bg-muted text-foreground/70 hover:text-foreground transition-colors"
          aria-label="Notificações"
          data-testid="button-notifications"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-bold text-foreground">Notificações</h3>
          {unread > 0 && (
            <button
              onClick={() => readAll.mutate()}
              className="text-xs text-primary hover:underline font-medium"
            >
              Marcar todas como lidas
            </button>
          )}
        </div>
        <ScrollArea className="max-h-[480px]">
          {isLoading && (
            <div className="p-6 text-center text-sm text-muted-foreground">Carregando...</div>
          )}
          {!isLoading && items.length === 0 && (
            <div className="p-8 text-center">
              <Bell className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação ainda</p>
            </div>
          )}
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => handleClick(n)}
              className={cn(
                "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/60 transition-colors border-b border-border/50",
                !n.isRead && "bg-primary/5"
              )}
            >
              <div className="relative flex-shrink-0">
                <UserAvatar nome={n.actor?.nome ?? "?"} photoUrl={n.actor?.photoUrl} size="sm" />
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm",
                  n.type === "like" ? "bg-rose-500" : "bg-blue-500"
                )}>
                  {n.type === "like" ? <Heart className="w-3 h-3 fill-white" /> : <MessageCircle className="w-3 h-3" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">
                  <span className="font-semibold">{n.actor?.nome ?? "Alguém"}</span>{" "}
                  {n.type === "like" ? "curtiu" : "comentou em"}{" "}
                  <span className="font-medium">{n.receita?.titulo ?? "sua receita"}</span>
                </p>
                {n.type === "comment" && n.comentarioTexto && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 italic">"{n.comentarioTexto}"</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
              )}
            </button>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
