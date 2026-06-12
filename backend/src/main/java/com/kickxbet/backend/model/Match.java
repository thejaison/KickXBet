package com.kickxbet.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "matches")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String league;

    @Column(name = "team_a", nullable = false)
    private String teamA;

    @Column(name = "team_b", nullable = false)
    private String teamB;

    @Column(name = "odds_a", nullable = false)
    private double oddsA;

    @Column(name = "odds_b", nullable = false)
    private double oddsB;

    @Column(name = "team_a_image", columnDefinition = "text")
    private String teamAImage;

    @Column(name = "team_b_image", columnDefinition = "text")
    private String teamBImage;

    @Column(name = "total_bet_a", nullable = false, columnDefinition = "double precision default 0.0")
    private double totalBetA = 0.0;

    @Column(name = "total_bet_b", nullable = false, columnDefinition = "double precision default 0.0")
    private double totalBetB = 0.0;

    @Column(name = "bet_count_a", nullable = false, columnDefinition = "integer default 0")
    private int betCountA = 0;

    @Column(name = "bet_count_b", nullable = false, columnDefinition = "integer default 0")
    private int betCountB = 0;

    @Column(nullable = false)
    private String status;

    @Column(name = "target_kickoff")
    private String targetKickoff;

    @Column(name = "live_elapsed_minutes", columnDefinition = "double precision default 0.0")
    private double liveElapsedMinutes;

    @Column(name = "winner_team")
    private String winnerTeam;

    @Column(nullable = false, columnDefinition = "integer default 0")
    private int votes = 0;

    public Match(Long id, String league, String teamA, String teamB, double oddsA, double oddsB, String status,
            String targetKickoff, double liveElapsedMinutes, String winnerTeam, int votes) {
        this.id = id;
        this.league = league;
        this.teamA = teamA;
        this.teamB = teamB;
        this.oddsA = oddsA;
        this.oddsB = oddsB;
        this.status = status;
        this.targetKickoff = targetKickoff;
        this.liveElapsedMinutes = liveElapsedMinutes;
        this.winnerTeam = winnerTeam;
        this.votes = votes;
    }
}
