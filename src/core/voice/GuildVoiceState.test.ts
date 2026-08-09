import { describe, it, expect, beforeEach } from "vitest";
import { Collection } from "discord.js";
import { GuildVoiceState } from "./GuildVoiceState";

describe("GuildVoiceState", () => {
    let mockGuild: any;
    let voiceState: GuildVoiceState;

    beforeEach(() => {
        mockGuild = {
            id: "guild123",
            client: {
                user: { id: "bot123" },
            },
            voiceStates: {
                cache: new Map(),
            },
        };
        voiceState = new GuildVoiceState(mockGuild);
    });

    it("should return false for shouldTriggerAutoDisconnectTimer if other human members exist", () => {
        const mockMembers = new Collection<string, any>([
            ["bot123", { user: { id: "bot123", bot: true } }],
            ["human1", { user: { id: "human1", bot: false } }],
        ]);

        mockGuild.voiceStates.cache.set("bot123", {
            channel: {
                members: mockMembers,
            },
        });

        expect(voiceState.shouldTriggerAutoDisconnectTimer()).toBe(false);
    });

    it("should return true for shouldTriggerAutoDisconnectTimer if only bots remain in channel", () => {
        const mockMembers = new Collection<string, any>([
            ["bot123", { user: { id: "bot123", bot: true } }],
            ["otherBot", { user: { id: "otherBot", bot: true } }],
        ]);

        mockGuild.voiceStates.cache.set("bot123", {
            channel: {
                members: mockMembers,
            },
        });

        expect(voiceState.shouldTriggerAutoDisconnectTimer()).toBe(true);
    });

    it("should handle null client.user safely without crashing", () => {
        mockGuild.client.user = null;
        expect(voiceState.shouldTriggerAutoDisconnectTimer()).toBe(false);
        expect(voiceState.shouldCancelAutoDisconnectTimer()).toBe(false);
    });
});
