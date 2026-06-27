import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, Package, AlertTriangle, Truck, Users, ShoppingCart, Hammer, Info, X, Loader2 } from 'lucide-react';
import { getNotifications, getUnreadCount, markNotificationAsRead, markAllNotificationsAsRead } from '../../services/notification.service';

const TYPE_CONFIG = {
  NEW_ORDER: { icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  COMPLETED_ORDER: { icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  ORDER_STATUS_CHANGE: { icon: Package, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  LOW_STOCK: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
  DELAYED_PRODUCTION: { icon: Hammer, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  LATE_DELIVERY: { icon: Truck, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  USER_CREATED: { icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
  SYSTEM: { icon: Info, color: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-50 dark:bg-slate-950', border: 'border-slate-200 dark:border-slate-700' },
};

const PRIORITY_COLORS = {
  low: 'bg-slate-400',
  medium: 'bg-blue-500',
  high: 'bg-amber-500',
  critical: 'bg-red-500',
};

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const panelRef = useRef(null);

  // Fetch unread count on mount and every 30 seconds
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      if (res?.success) setUnreadCount(res.data.unreadCount);
    } catch (e) {
      // silently ignore
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notifications when panel opens
  const fetchNotifications = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await getNotifications(pageNum, 15);
      if (res?.success) {
        const newNotifications = res.data.notifications;
        if (pageNum === 1) {
          setNotifications(newNotifications);
        } else {
          setNotifications(prev => [...prev, ...newNotifications]);
        }
        setHasMore(pageNum < res.data.pagination.totalPages);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (e) {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPage(1);
      fetchNotifications(1);
    }
  }, [isOpen, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id) => {
    try {
      await markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { /* ignore */ }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) { /* ignore */ }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNotifications(nextPage);
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-800 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 border-2 border-white animate-in zoom-in duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[520px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Notifications</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{unreadCount} unread</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell className="w-10 h-10 mb-3 text-slate-300" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No notifications yet</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div>
                {notifications.map((n) => {
                  const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
                  const IconComponent = config.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                      className={`px-5 py-3.5 border-b border-slate-50 hover:bg-slate-50/80 transition-colors cursor-pointer ${!n.isRead ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <IconComponent className={`w-4 h-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight ${!n.isRead ? '' : 'font-medium text-slate-600 dark:text-slate-300'}`}>
                              {n.title}
                            </p>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_COLORS[n.priority] || PRIORITY_COLORS.medium}`}></span>
                              {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{formatTime(n.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full py-3 text-sm text-primary hover:bg-blue-50 font-medium transition-colors"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Load more'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
