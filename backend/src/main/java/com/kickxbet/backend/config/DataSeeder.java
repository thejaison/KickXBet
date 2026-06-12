package com.kickxbet.backend.config;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.kickxbet.backend.model.Match;
import com.kickxbet.backend.model.Role;
import com.kickxbet.backend.model.User;
import com.kickxbet.backend.repository.MatchRepository;
import com.kickxbet.backend.repository.UserRepository;

@Component
public class DataSeeder implements CommandLineRunner {

        @Autowired
        private MatchRepository matchRepository;

        @Autowired
        private UserRepository userRepository;

        @Override
        public void run(String... args) throws Exception {
                Optional<User> existingAdmin = userRepository.findByUsername("thejaison");
                if (existingAdmin.isEmpty()) {
                        existingAdmin = userRepository.findByEmail("thejaisonadmin@betx");
                }

                if (existingAdmin.isEmpty()) {
                        User adminUser = new User();
                        adminUser.setUsername("thejaison");
                        adminUser.setEmail("thejaisonadmin@betx");
                        adminUser.setPassword("urumbil578");
                        adminUser.setBalance(0.0);
                        adminUser.setRole(Role.ADMIN);
                        userRepository.save(adminUser);
                        System.out.println(">>> Super admin account created: thejaison");
                } else {
                        User adminUser = existingAdmin.get();
                        adminUser.setUsername("thejaison");
                        adminUser.setEmail("thejaisonadmin@betx");
                        adminUser.setPassword("urumbil578");
                        adminUser.setBalance(0.0);
                        adminUser.setRole(Role.ADMIN);
                        userRepository.save(adminUser);
                        System.out.println(">>> Super admin account verified/updated: " + adminUser.getUsername());
                }

                if (matchRepository.count() == 0) {
                        Instant now = Instant.now();

                        List<Match> initialMatches = Arrays.asList(
                                        new Match(null, "WORLD_CUP", "Portugal", "Argentina", 2.10, 1.85, "LIVE", "",
                                                        12.0, "", 142),
                                        new Match(null, "PREMIER_LEAGUE", "Man City", "Liverpool", 1.65, 2.80,
                                                        "UPCOMING",
                                                        now.plus(4, ChronoUnit.HOURS).toString(), 0.0, "", 270),
                                        new Match(null, "LALIGA", "Real Sociedad", "Villarreal", 2.05, 2.15, "UPCOMING",
                                                        now.plus(18, ChronoUnit.HOURS).toString(), 0.0, "", 41),
                                        new Match(null, "CHAMPIONS_LEAGUE", "Dortmund", "Atletico Madrid", 2.10, 2.05,
                                                        "UPCOMING",
                                                        now.plus(23, ChronoUnit.HOURS).toString(), 0.0, "", 112),
                                        new Match(null, "BUNDESLIGA", "Eintracht Frankfurt", "VfL Wolfsburg", 1.95,
                                                        2.25, "UPCOMING",
                                                        now.plus(14, ChronoUnit.HOURS).toString(), 0.0, "", 61),
                                        new Match(null, "WORLD_CUP", "Spain", "Portugal", 2.05, 2.05, "UPCOMING",
                                                        now.plus(17, ChronoUnit.HOURS).toString(), 0.0, "", 172));

                        matchRepository.saveAll(initialMatches);
                        System.out.println(">>> Database Success: 35 Professional Sports Fixtures Populated!");
                }
        }
}
