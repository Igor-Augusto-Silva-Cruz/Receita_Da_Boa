import * as React from "react"
import { useGetAdminReports, useAdminDeleteReceita, useBanUsuario, useGetMe, getGetAdminReportsQueryKey, useGetAdminComentarioReports, useAdminDeleteComentario, getGetAdminComentarioReportsQueryKey } from "@workspace/api-client-react"
import { Sidebar } from "@/components/Sidebar"
import { UserAvatar } from "@/components/UserAvatar"
import { RecipeDetailModal } from "@/components/RecipeDetailModal"
import { ShieldAlert, Trash2, Ban, ChevronDown, ChevronUp, MessageSquare, FileText, MessageCircle, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "wouter"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ReportedReceita } from "@workspace/api-client-react/src/generated/api.schemas"
import { cn } from "@/lib/utils"

type Tab = "receitas" | "comentarios"

export default function Moderation() {
  const { data: user } = useGetMe({ query: { retry: false } })
  const { data: reportedReceitas, isLoading: receitasLoading } = useGetAdminReports({ query: { enabled: user?.papel === 'adm' } })
  const { data: reportedComentarios, isLoading: comentariosLoading } = useGetAdminComentarioReports({ query: { enabled: user?.papel === 'adm' } })
  const { mutate: deleteRecipe } = useAdminDeleteReceita()
  const { mutate: deleteComment } = useAdminDeleteComentario()
  const { mutate: banUser } = useBanUsuario()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [tab, setTab] = React.useState<Tab>("receitas")
  const [expandedId, setExpandedId] = React.useState<number | null>(null)
  const [previewRecipe, setPreviewRecipe] = React.useState<ReportedReceita | null>(null)

  const handleDeleteRecipe = (id: number) => {
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

  const handleDeleteComment = (id: number) => {
    if (confirm("Excluir este comentário?")) {
      deleteComment({ id }, {
        onSuccess: () => {
          toast({ title: "Comentário excluído" })
          queryClient.invalidateQueries({ queryKey: getGetAdminComentarioReportsQueryKey() })
        }
      })
    }
  }

  const handleBan = (id: number, name: string) => {
    if (confirm(`Banir o usuário ${name}?`)) {
      banUser({ id }, {
        onSuccess: () => {
          toast({ title: "Usuário banido", variant: "destructive" })
          queryClient.invalidateQueries()
        }
      })
    }
  }

  const handleIgnoreRecipe = async (id: number) => {
    try {
      const r = await fetch(`/api/admin/reports/receita/${id}/ignore`, { method: "POST" })
      if (!r.ok) throw new Error()
      toast({ title: "Denúncias ignoradas" })
      queryClient.invalidateQueries({ queryKey: getGetAdminReportsQueryKey() })
    } catch {
      toast({ title: "Erro ao ignorar", variant: "destructive" })
    }
  }

  const handleIgnoreComment = async (id: number) => {
    try {
      const r = await fetch(`/api/admin/reports/comentario/${id}/ignore`, { method: "POST" })
      if (!r.ok) throw new Error()
      toast({ title: "Denúncias ignoradas" })
      queryClient.invalidateQueries({ queryKey: getGetAdminComentarioReportsQueryKey() })
    } catch {
      toast({ title: "Erro ao ignorar", variant: "destructive" })
    }
  }

  if (user && user.papel !== 'adm') {
    return <div className="p-10 text-center font-bold text-2xl">Acesso Negado</div>
  }

  const receitaCount = reportedReceitas?.length ?? 0
  const comentarioCount = reportedComentarios?.length ?? 0

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden font-sans">
      <Sidebar
        user={user}
        search="" setSearch={() => {}}
        activeFeed="recentes" setActiveFeed={() => {}}
        setCategoriaId={() => {}}
        onNewRecipe={() => {}} onNewCategory={() => {}}
      />

      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-muted/20">
        <div className="p-4 sm:p-6 md:p-12 max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground">Painel de Moderação</h2>
              <p className="text-muted-foreground mt-1 text-sm md:text-lg">Gerencie denúncias e usuários.</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-muted rounded-2xl w-fit">
            <button
              onClick={() => setTab("receitas")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                tab === "receitas" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <FileText className="w-4 h-4" />
              Receitas
              {receitaCount > 0 && <span className="ml-1 w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">{receitaCount}</span>}
            </button>
            <button
              onClick={() => setTab("comentarios")}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                tab === "comentarios" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageCircle className="w-4 h-4" />
              Comentários
              {comentarioCount > 0 && <span className="ml-1 w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center">{comentarioCount}</span>}
            </button>
          </div>

          {/* Receitas tab */}
          {tab === "receitas" && (
            <div className="space-y-4">
              {receitasLoading ? (
                <div className="text-center py-12 text-muted-foreground">Carregando...</div>
              ) : receitaCount === 0 ? (
                <div className="bg-card border border-border shadow-card rounded-3xl px-8 py-16 text-center font-medium text-muted-foreground">
                  Nenhuma receita denunciada. Tudo limpo! ✨
                </div>
              ) : reportedReceitas?.map(report => (
                <div key={report.id} className="bg-card border border-border shadow-card rounded-3xl overflow-hidden">
                  <div
                    className="flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-4 p-4 md:p-6 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setPreviewRecipe(previewRecipe?.id === report.id ? null : report)}
                  >
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden bg-muted flex-shrink-0">
                      {report.urlImagem ? (
                        <img src={report.urlImagem} alt={report.titulo} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-bold">RdB</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground text-base md:text-lg break-words">{report.titulo}</h3>
                        {report.categoria && (
                          <span className="text-xs bg-[#df5d3a] text-white px-2 py-1 rounded-full font-bold">{report.categoria.nome}</span>
                        )}
                      </div>
                      <Link href={`/usuario/${report.autorId}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground hover:text-primary w-fit">
                        <UserAvatar nome={report.autor?.nome} photoUrl={report.autor?.photoUrl} size="xs" />
                        <span>{report.autor?.nome}</span>
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                      <div className="text-center">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-orange-500/10 text-orange-600 font-bold flex items-center justify-center text-sm">{report.reportCount}</div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); setExpandedId(expandedId === report.id ? null : report.id); }} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                        {expandedId === report.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="flex gap-2 flex-wrap basis-full md:basis-auto md:ml-auto">
                      <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); handleIgnoreRecipe(report.id); }} className="text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/30 flex-1 md:flex-none">
                        <Check className="w-4 h-4 mr-1.5" /> Ignorar
                      </Button>
                      <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); handleDeleteRecipe(report.id); }} className="text-destructive hover:bg-destructive/10 hover:border-destructive/30 flex-1 md:flex-none">
                        <Trash2 className="w-4 h-4 mr-1.5" /> Excluir
                      </Button>
                      <Button variant="outline" size="sm" onClick={e => { e.stopPropagation(); handleBan(report.autorId, report.autor?.nome || ''); }} className="text-destructive hover:bg-destructive/10 hover:border-destructive/30 flex-1 md:flex-none">
                        <Ban className="w-4 h-4 mr-1.5" /> Banir
                      </Button>
                    </div>
                  </div>

                  {expandedId === report.id && report.reports?.length > 0 && (
                    <div className="border-t border-border divide-y divide-border/50">
                      {report.reports.map(r => (
                        <div key={r.id} className="px-6 py-4 flex items-start gap-3">
                          <UserAvatar nome={r.denunciante?.nome} photoUrl={r.denunciante?.photoUrl} size="sm" className="mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-foreground">{r.denunciante?.nome ?? "Usuário"}</span>
                              <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: ptBR })}</span>
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
          )}

          {/* Comentários tab */}
          {tab === "comentarios" && (
            <div className="space-y-4">
              {comentariosLoading ? (
                <div className="text-center py-12 text-muted-foreground">Carregando...</div>
              ) : comentarioCount === 0 ? (
                <div className="bg-card border border-border shadow-card rounded-3xl px-8 py-16 text-center font-medium text-muted-foreground">
                  Nenhum comentário denunciado. Tudo limpo! ✨
                </div>
              ) : reportedComentarios?.map(item => (
                <div key={item.id} className="bg-card border border-border shadow-card rounded-3xl overflow-hidden">
                  <div className="p-4 md:p-6">
                    <div className="flex items-start gap-3 md:gap-4">
                      <UserAvatar nome={item.autor?.nome} photoUrl={item.autor?.photoUrl} size="sm" className="flex-shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Link href={`/usuario/${item.userId}`} className="font-bold text-foreground hover:text-primary text-sm">{item.autor?.nome}</Link>
                          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: ptBR })}</span>
                          <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                            na receita: <span className="font-medium">{item.receita?.titulo}</span>
                          </span>
                        </div>
                        <div className="bg-muted/60 rounded-2xl px-4 py-3 mb-3">
                          <p className="text-sm text-foreground/80">{item.texto}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-500/10 px-2 py-1 rounded-full">
                            <ShieldAlert className="w-3 h-3" /> {item.reportCount} {item.reportCount === 1 ? 'denúncia' : 'denúncias'}
                          </span>
                          <Button variant="outline" size="sm" onClick={() => handleIgnoreComment(item.id)} className="text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500/30 h-7 text-xs">
                            <Check className="w-3 h-3 mr-1" /> Ignorar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteComment(item.id)} className="text-destructive hover:bg-destructive/10 hover:border-destructive/30 h-7 text-xs">
                            <Trash2 className="w-3 h-3 mr-1" /> Excluir Comentário
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleBan(item.userId, item.autor?.nome || '')} className="text-destructive hover:bg-destructive/10 hover:border-destructive/30 h-7 text-xs">
                            <Ban className="w-3 h-3 mr-1" /> Banir Usuário
                          </Button>
                        </div>
                      </div>
                      <button onClick={() => setExpandedId(expandedId === item.id ? null : item.id)} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground flex-shrink-0">
                        {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {expandedId === item.id && item.reports?.length > 0 && (
                      <div className="mt-4 border-t border-border pt-4 space-y-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Motivos das denúncias</p>
                        {item.reports.map(r => (
                          <div key={r.id} className="flex items-start gap-3">
                            <UserAvatar nome={r.denunciante?.nome} photoUrl={r.denunciante?.photoUrl} size="xs" className="mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-xs font-medium text-foreground">{r.denunciante?.nome}</span>
                              <span className="text-xs text-muted-foreground ml-2">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: ptBR })}</span>
                              <p className="text-xs text-foreground/80 italic mt-0.5">"{r.motivo}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

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
