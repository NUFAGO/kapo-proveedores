'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/context/sidebar-context';
import { useTheme } from '@/context/theme-context';
import { useAuth, useAuthProveedor } from '@/hooks';
import {
  MdDashboard,
  MdAssignment,
  MdShoppingCart,
  MdApproval,
  MdLibraryBooks,
  MdDescription,
  MdChecklist,
  MdPayments,
  MdLogout,
  MdExpandMore,
  MdExpandLess,
  MdFileUpload,
  MdBusiness,
  MdMiscellaneousServices,
  MdViewKanban,
  MdPeople,
  MdAssessment,
} from 'react-icons/md';
import { FaRegFolderOpen } from "react-icons/fa6";
import { TbTemplateFilled } from "react-icons/tb";
import { LuClipboardList } from "react-icons/lu";
import { LuBuilding2 } from "react-icons/lu";
import { FaFileInvoiceDollar } from 'react-icons/fa6';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NavSubItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavItem {
  name: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  subItems?: NavSubItem[];
}

// Navegación para administradores (interno)
const adminNavItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: MdDashboard,
  },
  {
    name: 'Revisión y Asignación',
    icon: MdAssignment,
    subItems: [
      {
        name: 'Órdenes de Compra',
        href: '/revision-asignacion/ordenes-compra',
        icon: FaFileInvoiceDollar,
      },
      {
        name: 'Kanban',
        href: '/revision-asignacion/kanban',
        icon: MdViewKanban,
      },
    ],
  },

  {
    name: 'Configuracion',
    icon: MdLibraryBooks,
    subItems: [
      {
        name: 'Tipos de Documento',
        href: '/configuracion/tipos-documentos',
        icon: MdDescription,
      },
      {
        name: 'Plantillas Documento',
        href: '/configuracion/plantillas-documento',
        icon: TbTemplateFilled,
      },
      {
        name: 'Categorías Checklist',
        href: '/configuracion/categorias-checklist',
        icon: MdChecklist,
      },
      {
        name: 'Checklists y Documentos',
        href: '/configuracion/checklist',
        icon: LuClipboardList,
      },

    ],
  },
  
    {
    name: 'Gestión',
    icon: MdAssignment,
    subItems: [
      {
        name: 'Proveedores',
        href: '/gestion/proveedores',
        icon: LuBuilding2,
      },
      {
        name: 'Usuarios',
        href: '/gestion/usuarios',
        icon: MdPeople,
      },
      {
        name: 'Reportes',
        href: '/gestion/reportes',
        icon: MdAssessment,
      },
    ],
  },

];

// Navegación para proveedores (portal)
const proveedorNavItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/proveedor/dashboard',
    icon: MdDashboard,
  },
  {
    name: 'Mis Órdenes',
    href: '/proveedor/ordenes',
    icon: FaRegFolderOpen,
  },
  {
    name: 'Reportes',
    href: '/proveedor/reportes',
    icon: MdDescription,
  },
];

interface SidebarProps {
  tipo?: 'admin' | 'proveedor';
}

export function Sidebar({ tipo = 'admin' }: SidebarProps) {
  const pathname = usePathname();
  const { isCollapsed, closeSidebar } = useSidebar();
  const { theme } = useTheme();

  // Usar el hook correcto según el tipo
  const authHook = tipo === 'admin' ? useAuth() : useAuthProveedor();
  const { logout, user } = authHook;

  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const navItems = tipo === 'admin' ? adminNavItems : proveedorNavItems;

  const getAllItemNames = (items: NavItem[]): string[] => {
    return items.filter(item => item.subItems && item.subItems.length > 0).map(item => item.name);
  };

  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    const next = new Set(getAllItemNames(navItems));
    next.add('Aprobaciones');
    return next;
  });

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleLogout = () => {
    console.log('🔘 Botón logout presionado - Iniciando logout...');
    try {
      logout();
      console.log('🔘 Logout completado - Redirigiendo a /login');
      router.push('/login');
    } catch (error) {
      console.error('❌ Error en logout:', error);
      // Forzar logout manualmente si hay error
      try {
        if (typeof window !== 'undefined') {
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
          localStorage.clear();
        }
      } catch (e) {
        console.error('❌ Error en logout forzado:', e);
      }
      router.push('/login');
    }
  };

  const isRouteActive = (href: string) => {
    const cleanPathname = pathname.replace(/\/$/, '') || '/';
    const cleanHref = href.replace(/\/$/, '') || '/';

    if (cleanHref === '/') {
      return cleanPathname === '/';
    }

    return cleanPathname === cleanHref || cleanPathname.startsWith(cleanHref + '/');
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  // Auto-expandir items que tienen una subruta activa
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.subItems) {
        const hasActiveSubItem = item.subItems.some((subItem) => isRouteActive(subItem.href));
        if (hasActiveSubItem) {
          setExpandedItems((prev) => new Set(prev).add(item.name));
        }
      }
    });
  }, [pathname]);

  return (
    <>
      <div
        className={clsx(
          'flex h-full flex-col bg-(--sidebar-bg) transition-all duration-300 card-shadow',
          'fixed md:relative z-30',
          {
            'w-16': isCollapsed && !isMobile,
            'w-60': !isCollapsed,
            '-translate-x-full': isCollapsed && isMobile,
            'translate-x-0': !isCollapsed || !isMobile,
          }
        )}
        style={{ isolation: 'isolate' }}
      >
        <Link
          className="flex h-15 items-center justify-center px-4 hover:opacity-90 transition-opacity duration-300"
          href={tipo === 'admin' ? '/dashboard' : '/proveedor/dashboard'}
        >
          <div
            className={clsx(
              'w-full flex flex-col items-center justify-center transition-all duration-300 gap-1',
              isCollapsed && !isMobile ? 'scale-75' : ''
            )}
          >
            {isCollapsed && !isMobile ? (
              <div className={clsx(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                theme === 'dark'
                  ? "bg-transparent"
                  : "bg-gray-900"
              )}>
                <Image
                  src="/logo-negativo.webp"
                  alt="Activos Fijos Logo"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  priority
                />
              </div>
            ) : (
              <>
                <div className={clsx(
                  "inline-flex items-center justify-center transition-all duration-300 rounded-lg",
                  theme === 'dark'
                    ? "bg-transparent"
                    : "bg-gray-900"
                )}>
                  <Image
                    src="/logo-negativo.webp"
                    alt="Activos Fijos Logo"
                    width={100}
                    height={35}
                    className="h-8 w-auto object-contain "
                    priority
                  />
                </div>
                <span className={clsx(
                  "text-[10px] font-medium text-center leading-tight",
                  theme === 'dark'
                    ? "text-text-secondary"
                    : "text-gray-700"
                )}>
                  {tipo === 'admin' ? 'Admin Portal' : 'Proveedor Portal'}
                </span>
              </>
            )}
          </div>
        </Link>

        <div
          className={clsx('flex flex-col h-[calc(100%-60px)]', {
            'overflow-hidden': isCollapsed && !isMobile,
            'overflow-y-auto': !isCollapsed || isMobile,
          })}
        >
          <div className="flex flex-col space-y-1 p-3 flex-1 overflow-x-hidden">
            {navItems.map((item) => {
              const Icon = item.icon;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedItems.has(item.name);

              // Si tiene subitems, mostrar como menú desplegable
              if (hasSubItems) {
                const hasActiveSubItem = item.subItems!.some((subItem) => isRouteActive(subItem.href));

                // Cuando está colapsado, mostrar directamente los subItems (sin el grupo padre)
                if (isCollapsed && !isMobile) {
                  return (
                    <div key={item.name} className="flex flex-col">
                      {item.subItems!.map((subItem: NavSubItem) => {
                        const SubIcon = subItem.icon;
                        const subActive = isRouteActive(subItem.href);
                        return (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className={clsx(
                              'flex items-center justify-center px-3 py-2 rounded-md text-xs font-medium relative transition-all duration-300 ease-in-out sidebar-nav-item group',
                              {
                                'bg-(--sidebar-active-bg-light) text-sidebar-active-text-light sidebar-nav-item-active border-l-[3px] border-(--sidebar-active-bg)': subActive,
                                'text-text-secondary hover:bg-(--hover-bg) hover:text-text-primary': !subActive,
                              }
                            )}
                            title={subItem.name}
                          >
                            {SubIcon && (
                              <SubIcon className={clsx(
                                'w-5 h-5 shrink-0 transition-all duration-300 ease-in-out',
                                {
                                  'text-sidebar-active-text-light': subActive,
                                  'text-text-secondary group-hover:scale-110 group-hover:text-text-primary': !subActive,
                                }
                              )} />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  );
                }

                // Cuando está expandido, mostrar el grupo padre con subItems
                return (
                  <div key={item.name} className="flex flex-col">
                    <button
                      onClick={() => {
                        if (!isCollapsed || isMobile) {
                          toggleExpanded(item.name);
                        }
                      }}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium relative transition-all duration-300 ease-in-out sidebar-nav-item group w-full',
                        {
                          'bg-(--sidebar-active-bg-light) text-sidebar-active-text-light sidebar-nav-item-active border-l-[3px] border-(--sidebar-active-bg)': hasActiveSubItem,
                          'text-text-secondary hover:bg-(--hover-bg) hover:text-text-primary': !hasActiveSubItem,
                        }
                      )}
                    >
                      {Icon && (!isExpanded || isCollapsed) && (
                        <Icon className={clsx(
                          'w-5 h-5 shrink-0 transition-all duration-300 ease-in-out',
                          {
                            'text-sidebar-active-text-light': hasActiveSubItem,
                            'text-text-secondary group-hover:scale-110 group-hover:text-text-primary': !hasActiveSubItem,
                          }
                        )} />
                      )}
                      <span className="truncate transition-all duration-300 ease-in-out flex-1 text-left">{item.name}</span>
                      {isExpanded ? (
                        <MdExpandLess className="w-4 h-4 shrink-0" />
                      ) : (
                        <MdExpandMore className="w-4 h-4 shrink-0" />
                      )}
                    </button>

                    {/* Subitems */}
                    {isExpanded && (
                      <div className="ml-4 mt-1 space-y-1">
                        {item.subItems!.map((subItem: NavSubItem) => {
                          const SubIcon = subItem.icon;
                          const subActive = isRouteActive(subItem.href);
                          return (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => {
                                if (isMobile) {
                                  closeSidebar();
                                }
                              }}
                              className={clsx(
                                'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium relative transition-all duration-300 ease-in-out sidebar-nav-item group',
                                {
                                  'bg-(--hover-bg) text-text-primary': subActive,
                                  'text-text-secondary hover:bg-(--hover-bg) hover:text-text-primary': !subActive,
                                }
                              )}
                            >
                              {SubIcon && (
                                <SubIcon className={clsx(
                                  'w-4 h-4 shrink-0 transition-all duration-300 ease-in-out',
                                  {
                                    'text-text-primary': subActive,
                                    'text-text-secondary group-hover:scale-110 group-hover:text-text-primary': !subActive,
                                  }
                                )} />
                              )}
                              <span className="truncate transition-all duration-300 ease-in-out">{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Si no tiene subitems, mostrar como link normal
              const active = item.href ? isRouteActive(item.href) : false;

              return (
                <Link
                  key={item.href || item.name}
                  href={item.href || '#'}
                  onClick={() => {
                    if (isMobile) {
                      closeSidebar();
                    }
                  }}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium relative transition-all duration-300 ease-in-out sidebar-nav-item group',
                    {
                      'bg-(--sidebar-active-bg-light) text-sidebar-active-text-light sidebar-nav-item-active border-l-[3px] border-(--sidebar-active-bg)': active,
                      'text-text-secondary hover:bg-(--hover-bg) hover:text-text-primary': !active,
                      'justify-center': isCollapsed && !isMobile,
                    }
                  )}
                  title={isCollapsed && !isMobile ? item.name : undefined}
                >
                  {Icon && (
                    <Icon className={clsx(
                      'w-5 h-5 shrink-0 transition-all duration-300 ease-in-out',
                      {
                        'text-sidebar-active-text-light': active,
                        'text-text-secondary group-hover:scale-110 group-hover:text-text-primary': !active,
                      }
                    )} />
                  )}
                  {(!isCollapsed || isMobile) && (
                    <span className="truncate transition-all duration-300 ease-in-out">{item.name}</span>
                  )}
                </Link>
              );
            })}
            <div className="h-auto w-full grow rounded-md"></div>
          </div>

          <div className="text-center p-2 space-y-1">
            <button
              onClick={handleLogout}
              className={clsx(
                'flex cursor-pointer items-center justify-center gap-1 text-xs p-2 rounded-md bg-(--content-bg) hover:bg-(--hover-bg) w-full text-text-secondary hover:text-text-primary transition-all duration-300 ease-in-out sidebar-nav-item group card-shadow',
                isCollapsed && !isMobile && 'justify-center'
              )}
            >
              <MdLogout className="w-4 h-4 transition-all duration-300 ease-in-out group-hover:scale-110" />
              {(!isCollapsed || isMobile) && <span>Desconectar</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Overlay para móvil */}
      <div
        className={clsx(
          'fixed inset-0 bg-black/50 z-20',
          isMobile && !isCollapsed ? 'block' : 'hidden'
        )}
        onClick={closeSidebar}
      />
    </>
  );
}
