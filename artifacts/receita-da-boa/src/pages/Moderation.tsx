import * as React from "react"
import { useGetAdminReports, useAdminDeleteReceita, useBanUsuario, useGetMe, getGetAdminReportsQueryKey } from "@workspace/api-client-react"
import { Sidebar } from "@/components/Sidebar"
import { UserAvatar } from "@/components/UserAvatar"
import { RecipeDetailModal } from "@/components/RecipeDetailModal"
import { ShieldAlert, Trash2, Ban, ChevronDown, ChevronUp, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "wouter"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ReportedReceita } from "@workspace/api-client-react/src/generated/api.schemas"

export default function Moderation() {
  const { data: user } = useGetMe({ query: { retry: false } })
  const { data: reports, isLoading } = useGetAdminReports({ query: { enabled: user?.papel === 'adm' } })
  const { mutate: deleteRecipe } = useAdminDeleteReceita()
  const { mutate: banUser } = useBanUsuario()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [expandedId, setExpandedId] = React.useState<number | null>(null)
  const [previewRecipe, setPreviewRecipe] = React.useState<ReportedReceita | null>(null)

  const handleDelete = (id: number) => {
    if (confirm("Excluir definitivamente esta receita?")) {
      deleteRecipe({ id }, {
        onSuccess: () => {
          toast({ title: "Receita excluída" })
          queryClient.invalidateQueries({ queryKey: getGetAdminReportsQueryKey() })
          setPreviewRecipe(null)
        }
      })
    }
  }

  const handleBan = (id: number, name: string) => {
    if (confirm(`Banir o usuário ${name}? Ele não poderá mais criar receitas.`)) {
      banUser({ id }, {
        onSuccess: () => {
          toast({ title: "Usuário banido", variant: "destructive" })
          queryClient.invalidateQueries({ queryKey: getGetAdminReportsQueryKey() })
        }
      })
    }
  }

  if (user && user.papel !== 'adm') {
    return <div className="p-10 text-center font-bold text-2xl">Acesso Negado</div>
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <Sidebar 
        user={user}
        search="" setSearch={() => {}}
        activeFeed="recentes" setActiveFeed={() => {}}
        setCategoriaId={() => {}}
        onNewRecipe={() => {}} onNewCategory={() => {}}
      />

      <main className="flex-1 flex flex-col h-full overflow-y-auto bg-muted/20">
        <div className="p-8 md:p-12 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-4xl font-display font-bold text-foreground">Painel de Moderação</h2>
              <p className="text-muted-foreground mt-1 text-lg">Gerencie denúncias e usuários da comunidade.</p>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Carregando...</div>
            ) : reports?.length === 0 ? (
              <div className="bg-card border border-border shadow-card rounded-3xl px-8 py-16 text-center font-medium text-muted-foreground">
                Nenhuma denúncia pendente. Tudo limpo! ✨
              </div>
            ) : reports?.map(report => (
              <div key={report.id} className="bg-card border border-border shadow-card rounded-3xl overflow-hidden">
                {/* Recipe header — click to open detail modal */}
                <div
                  className="flex items-center gap-4 p-6 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setPreviewRecipe(previewRecipe?.id === report.id ? null : report)}
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                    {report.urlImagem ? (
                      <img src={report.urlImagem} alt={report.titulo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-bold">RdB</div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-foreground text-lg">{report.titulo}</h3>
                      {report.categoria && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{report.categoria.nome}</span>
                      )}
                    </div>
                    <Link href={`/usuario/${report.autorId}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground hover:text-primary w-fit">
                      <UserAvatar nome={report.autor?.nome} photoUrl={report.autor?.photoUrl} size="xs" />
                      <span>{report.autor?.nome}</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-600 font-bold flex items-center justify-center text-sm">
                        {report.reportCount}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">denúncias</div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(report.id); }} className="text-destructive hover:bg-destructive/10 hover:border-destructive/30">
                        <Trash2 className="w-4 h-4 mr-1.5" /> Excluir
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleBan(report.autorId, report.autor?.nome || ''); }} className="text-destructive hover:bg-destructive/10 hover:border-destructive/30">
                        <Ban className="w-4 h-4 mr-1.5" /> Banir
                      </Button>
                    </div>

                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === report.id ? null : report.id); }}
                      className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                    >
                      {expandedId === report.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Reports list — expandable */}
                {expandedId === report.id && report.reports && report.reports.length > 0 && (
                  <div className="border-t border-border divide-y divide-border/50">
                    {report.reports.map((r) => (
                      <div key={r.id} className="px-6 py-4 flex items-start gap-3">
                        <UserAvatar nome={r.denunciante?.nome} photoUrl={r.denunciante?.photoUrl} size="sm" className="mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-foreground">{r.denunciante?.nome ?? "Usuário"}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: ptBR })}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-foreground/80 italic">"{r.motivo}"</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Recipe detail modal for previewing reported recipes */}
      <RecipeDetailModal
        isOpen={!!previewRecipe}
        onClose={() => setPreviewRecipe(null)}
        recipe={previewRecipe as any}
        currentUser={user}
        onReport={() => {}}
      />
    </div>
  )
}
