import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
// Node strips the types of the registry's TypeScript libs (type-only imports).
import {
    getNotificationSoundPreferences,
    markNotificationSoundUnlockedForTests,
    resetNotificationSoundForTests,
    setNotificationSoundPreferences,
    shouldPlayChatSound,
    shouldPlayChatSoundForUnreadEvent,
    shouldPlayChatSoundOnUnreadIncrease,
    shouldPlayNotificationSound,
} from '../registry/src/lib/notification-sound.ts';
import {
    createNotificationsSource,
    defaultNotificationItem,
} from '../registry/src/lib/notifications-api.ts';

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;
const originalFetch = globalThis.fetch;

afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    globalThis.fetch = originalFetch;
});

function mockVisibleTab() {
    globalThis.window = { document: { visibilityState: 'visible' } };
}

test('both sounds stay off by default', () => {
    mockVisibleTab();
    resetNotificationSoundForTests();
    markNotificationSoundUnlockedForTests();

    assert.deepEqual(getNotificationSoundPreferences(), {
        isChatSoundEnabled: false,
        isNotificationSoundEnabled: false,
    });
    assert.equal(shouldPlayNotificationSound(), false);
    assert.equal(shouldPlayChatSound(), false);
});

test('the notification sound needs the preference and an unlocked audio context', () => {
    mockVisibleTab();
    resetNotificationSoundForTests();
    setNotificationSoundPreferences({
        isChatSoundEnabled: false,
        isNotificationSoundEnabled: true,
    });

    assert.equal(shouldPlayNotificationSound(), false);

    markNotificationSoundUnlockedForTests();

    assert.equal(shouldPlayNotificationSound(), true);
    assert.equal(shouldPlayChatSound(), false);
});

test('no sound in a hidden tab', () => {
    globalThis.window = { document: { visibilityState: 'hidden' } };
    resetNotificationSoundForTests();
    setNotificationSoundPreferences({
        isChatSoundEnabled: true,
        isNotificationSoundEnabled: true,
    });
    markNotificationSoundUnlockedForTests();

    assert.equal(shouldPlayNotificationSound(), false);
});

test('the chat sound plays on an unread rise or the playSound flag', () => {
    mockVisibleTab();
    resetNotificationSoundForTests();
    setNotificationSoundPreferences({
        isChatSoundEnabled: true,
        isNotificationSoundEnabled: false,
    });
    markNotificationSoundUnlockedForTests();

    assert.equal(shouldPlayChatSoundOnUnreadIncrease(0, 2), true);
    assert.equal(shouldPlayChatSoundOnUnreadIncrease(3, 1), false);
    assert.equal(shouldPlayChatSoundForUnreadEvent(0, 0, true), true);
    assert.equal(shouldPlayChatSoundForUnreadEvent(0, 0, false), false);
});

test('the default item reads title, body and url from the notification data', () => {
    const item = defaultNotificationItem({
        id: 'a1',
        type: 'App\\Notifications\\AlertNotification',
        data: { title: 'Disk full', body: '92% used', url: '/servers/3' },
        read_at: null,
        created_at: '2026-11-12T10:00:00+00:00',
    });

    assert.deepEqual(item, {
        id: 'a1',
        title: 'Disk full',
        body: '92% used',
        link: '/servers/3',
        time: '2026-11-12T10:00:00+00:00',
        isRead: false,
    });
});

/** Records every fetch and answers with the body the test queued for its URL. */
function mockServer(responsesByUrl) {
    const requests = [];

    globalThis.document = {
        cookie: 'theme=dark; XSRF-TOKEN=token%3D123',
        querySelector: () => null,
    };
    globalThis.fetch = async (url, options) => {
        requests.push({ url, ...options });

        return { ok: true, status: 200, json: async () => responsesByUrl[url] };
    };

    return requests;
}

test('the Laravel source calls the app endpoints with the CSRF cookie', async () => {
    const requests = mockServer({
        '/inbox/notifications': {
            data: [
                {
                    id: 'n1',
                    type: 'x',
                    data: { title: 'Hello' },
                    read_at: '2026-11-12T10:00:00+00:00',
                    created_at: '2026-11-12T09:00:00+00:00',
                },
            ],
        },
        '/inbox/notifications/unread-count': { count: 4 },
        '/inbox/notifications/read': { unread_count: 3 },
    });
    const source = createNotificationsSource({
        index: '/inbox/notifications',
        unreadCount: { url: '/inbox/notifications/unread-count' },
        read: '/inbox/notifications/read',
    });

    const items = await source.fetchNotifications();
    assert.equal(items[0].title, 'Hello');
    assert.equal(items[0].isRead, true);
    assert.equal(await source.fetchUnreadCount(), 4);
    assert.equal(await source.markRead(['n1']), 3);
    assert.equal(await source.markRead('all'), 3);
    assert.equal(source.markUnread, undefined);

    const [indexRequest, , readRequest, readAllRequest] = requests;
    assert.equal(indexRequest.method, 'GET');
    assert.equal(readRequest.method, 'POST');
    assert.equal(readRequest.headers['X-XSRF-TOKEN'], 'token=123');
    assert.equal(readRequest.body, JSON.stringify({ ids: ['n1'] }));
    assert.equal(readAllRequest.body, JSON.stringify({ all: true }));
});

test('the Laravel source rejects on an error response', async () => {
    mockServer({});
    globalThis.fetch = async () => ({ ok: false, status: 500 });
    const source = createNotificationsSource({
        index: '/notifications',
        unreadCount: '/notifications/unread-count',
        read: '/notifications/read',
        unread: '/notifications/unread',
    });

    await assert.rejects(source.markUnread(['n1']));
});
