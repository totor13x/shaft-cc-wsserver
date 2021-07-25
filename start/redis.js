'use strict'

/*
|--------------------------------------------------------------------------
| Redis Subscribers
|--------------------------------------------------------------------------
|
| Here you can register the subscribers to redis channels. Adonis assumes
| your listeners are stored inside `app/Listeners` directory.
|
*/

const Redis = use('Redis')

/**
 * Inline subscriber
 */
// Redis.subscribe('news', async () => {
// })

/**
 * Binding method from a module saved inside `app/Listeners/News`
 */
// Redis.subcribe('news', 'News.onMessage')
Redis.subscribe('admin/refresh_locks', 'AdminEvent.onRefreshLocks')

Redis.subscribe('track/finish', 'TrackEvent.onFinish')
Redis.subscribe('user/notify', 'UserEvent.onNotify')
Redis.subscribe('test', 'TestEvent.onMessage')
Redis.subscribe('logs/voice', 'LogEvent.onVoice')
Redis.subscribe('pointshop/points', 'PointshopEvent.onPoints')
Redis.subscribe('pointshop/add_item', 'PointshopEvent.onAddItem')
Redis.subscribe('tts/refresh_premium', 'TTSEvent.onRefreshPremium')
Redis.subscribe('tts/refresh_balance', 'TTSEvent.onRefreshBalance')
Redis.subscribe('tts/fill_balance', 'TTSEvent.onFillBalance')

Redis.subscribe('logs/track/play', 'LogEvent.onTrackPlay')