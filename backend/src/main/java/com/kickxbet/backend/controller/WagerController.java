package com.kickxbet.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.kickxbet.backend.model.Match;
import com.kickxbet.backend.model.User;
import com.kickxbet.backend.model.Wager;
import com.kickxbet.backend.repository.MatchRepository;
import com.kickxbet.backend.repository.UserRepository;
import com.kickxbet.backend.repository.WagerRepository;

@RestController
@RequestMapping("/api/wagers")
@CrossOrigin(origins = "http://localhost:5173")
public class WagerController {

    @Autowired
    private WagerRepository wagerRepository;

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/user/{username}")
    public List<Wager> getUserWagers(@PathVariable String username) {
        return wagerRepository.findByUsername(username);
    }

    @PostMapping
    @Transactional
    public Wager placeWager(@RequestBody Wager wager) {
        if (wager.getUsername() == null || wager.getUsername().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required for wagers.");
        }
        if (wager.getWager() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Wager amount must be positive.");
        }

        User user = userRepository.findByUsername(wager.getUsername())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found."));

        if (user.getBalance() < wager.getWager()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient balance.");
        }

        Match match = matchRepository.findById(wager.getMatchId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Match not found."));

        user.setBalance(user.getBalance() - wager.getWager());
        userRepository.save(user);

        if (wager.getTeamName().equals(match.getTeamA())) {
            match.setTotalBetA(match.getTotalBetA() + wager.getWager());
            match.setBetCountA(match.getBetCountA() + 1);
        } else if (wager.getTeamName().equals(match.getTeamB())) {
            match.setTotalBetB(match.getTotalBetB() + wager.getWager());
            match.setBetCountB(match.getBetCountB() + 1);
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Wager team does not match the fixture.");
        }

        matchRepository.save(match);

        wager.setUserId(user.getId());
        return wagerRepository.save(wager);
    }
}
