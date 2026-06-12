package com.kickxbet.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.kickxbet.backend.model.Match;
import com.kickxbet.backend.model.Role;
import com.kickxbet.backend.model.User;
import com.kickxbet.backend.repository.MatchRepository;
import com.kickxbet.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/matches")
@CrossOrigin(origins = "http://localhost:5173")
public class MatchController {
    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Match> getAllMatches() {
        return matchRepository.findAll();
    }

    @GetMapping("/league/{league}")
    public List<Match> getMatchesByLeague(@PathVariable String league) {
        if (league.equalsIgnoreCase("ALL")) {
            return matchRepository.findAll();
        }
        return matchRepository.findByLeague(league.toUpperCase());
    }

    @PostMapping
    public Match createMatch(@RequestParam String username, @RequestBody Match match) {
        User adminUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found."));
        if (adminUser.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin may create matches.");
        }
        return matchRepository.save(match);
    }

    @DeleteMapping("/{id}")
    public void deleteMatch(@PathVariable Long id, @RequestParam String username) {
        User adminUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found."));
        if (adminUser.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin may delete matches.");
        }
        matchRepository.deleteById(id);
    }

    @PatchMapping("/{id}/winner")
    public Match setMatchWinner(@PathVariable Long id, @RequestParam String username,
            @RequestBody Map<String, String> body) {
        User adminUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found."));
        if (adminUser.getRole() != Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only admin may set the winning team.");
        }
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match entry not located with ID: " + id));
        String winnerTeam = body.get("winnerTeam");
        if (winnerTeam == null || (!winnerTeam.equals(match.getTeamA()) && !winnerTeam.equals(match.getTeamB()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Winner must be one of the fixture teams.");
        }
        match.setWinnerTeam(winnerTeam);
        match.setStatus("COMPLETED");
        return matchRepository.save(match);
    }

    @PostMapping("/{id}/vote")
    public Match voteForMatch(@PathVariable Long id) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match entry not located with ID: " + id));
        match.setVotes(match.getVotes() + 1);
        return matchRepository.save(match);
    }
}
