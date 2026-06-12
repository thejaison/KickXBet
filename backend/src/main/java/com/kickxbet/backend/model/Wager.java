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
@Table(name = "wagers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Wager {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "match_id", nullable = false)
    private Long matchId;

    @Column(name = "team_name", nullable = false)
    private String teamName;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private double wager;

    @Column(nullable = false)
    private double odds;

    @Column(name = "username")
    private String username;
}
