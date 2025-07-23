'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { getBrowserClient } from '@/lib/supabase/browser-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Types for subscription management
interface SubscriptionConfig {
  table: string
  event?: '*' | 'INSERT' | 'UPDATE' | 'DELETE'
  filter?: string
  callback: () => void
}

interface SubscriptionState {
  [key: string]: {
    channel: RealtimeChannel
    subscribers: Set<string>
    config: SubscriptionConfig
  }
}

interface RealtimeContextType {
  subscribe: (id: string, config: SubscriptionConfig) => void
  unsubscribe: (id: string) => void
  isConnected: boolean
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const subscriptions = useRef<SubscriptionState>({})
  const supabase = useRef<ReturnType<typeof getBrowserClient> | null>(null)
  const [_connectionTimeout, _setConnectionTimeout] = useState<NodeJS.Timeout | null>(null)

  // Initialize Supabase client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      supabase.current = getBrowserClient()
    }
  }, [])

  // Create a unique subscription key
  const createSubscriptionKey = useCallback((config: SubscriptionConfig): string => {
    const { table, event = '*', filter } = config
    return `${table}:${event}:${filter || 'all'}`
  }, [])

  // Subscribe to real-time changes
  const subscribe = useCallback((_subscriberId: string, config: SubscriptionConfig) => {
    if (!supabase.current) return

    const key = createSubscriptionKey(config)

    // If subscription already exists, just add this subscriber
    if (subscriptions.current[key]) {
      subscriptions.current[key].subscribers.add(_subscriberId)
      return
    }

    // Create new subscription
    const channel = supabase.current
      .channel(`realtime-${key}`)
      .on('postgres_changes', {
        event: config.event || '*',
        schema: 'public',
        table: config.table,
        filter: config.filter
      } as any, () => {
        // Notify all subscribers
        subscriptions.current[key].subscribers.forEach(subscriberId => {
          subscriptions.current[key].config.callback()
        })
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    subscriptions.current[key] = {
      channel,
      subscribers: new Set([_subscriberId]),
      config
    }
  }, [createSubscriptionKey])

  // Unsubscribe from real-time changes
  const unsubscribe = useCallback((id: string) => {
    // Find all subscriptions that this subscriber is part of
    Object.entries(subscriptions.current).forEach(([key, subscription]) => {
      if (subscription.subscribers.has(id)) {
        subscription.subscribers.delete(id)

        // If no more subscribers, remove the subscription
        if (subscription.subscribers.size === 0) {
          subscription.channel.unsubscribe()
          delete subscriptions.current[key]
        }
      }
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(subscriptions.current).forEach(subscription => {
        subscription.channel.unsubscribe()
      })
      subscriptions.current = {}
    }
  }, [])

  // Connection health check
  useEffect(() => {
    const checkConnection = () => {
      if (!supabase.current) return

      // Simple ping to check connection
      supabase.current
        .channel('health-check')
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED')
        })
    }

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000)

    return () => clearInterval(interval)
  }, [])

  return (
    <RealtimeContext.Provider value={{ subscribe, unsubscribe, isConnected }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

// Hook for subscribing to specific table changes
export function useTableSubscription(
  table: string,
  event: '*' | 'INSERT' | 'UPDATE' | 'DELETE' = '*',
  filter?: string,
  callback?: () => void
) {
  const { subscribe, unsubscribe } = useRealtime()
  const subscriptionId = useRef<string>(`${table}-${Date.now()}-${Math.random()}`)

  useEffect(() => {
    if (!callback) return

    const config: SubscriptionConfig = {
      table,
      event,
      filter,
      callback
    }

    subscribe(subscriptionId.current, config)

    return () => {
      unsubscribe(subscriptionId.current)
    }
  }, [table, event, filter, callback, subscribe, unsubscribe])

  return { subscriptionId: subscriptionId.current }
}