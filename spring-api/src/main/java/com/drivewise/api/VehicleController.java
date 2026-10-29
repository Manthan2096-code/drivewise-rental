package com.drivewise.api;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {
    private final VehicleRepository vehicles;
    private final Validator validator;

    public VehicleController(VehicleRepository vehicles, Validator validator) {
        this.vehicles = vehicles;
        this.validator = validator;
    }

    @PostMapping
    public ResponseEntity<Vehicle> create(@Valid @RequestBody Vehicle vehicle) {
        vehicle.setId(null);
        return ResponseEntity.status(HttpStatus.CREATED).body(vehicles.save(vehicle));
    }

    @GetMapping
    public List<Vehicle> list() {
        return vehicles.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> get(@PathVariable Long id) {
        return vehicles.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vehicle> replace(@PathVariable Long id, @Valid @RequestBody Vehicle replacement) {
        if (!vehicles.existsById(id)) return ResponseEntity.notFound().build();
        replacement.setId(id);
        return ResponseEntity.ok(vehicles.save(replacement));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody JsonNode changes) {
        Vehicle vehicle = vehicles.findById(id).orElse(null);
        if (vehicle == null) return ResponseEntity.notFound().build();
        if (changes == null || !changes.isObject() || changes.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Provide at least one vehicle field to update."));
        }

        var fields = changes.fields();
        while (fields.hasNext()) {
            var field = fields.next();
            JsonNode value = field.getValue();
            switch (field.getKey()) {
                case "model" -> {
                    if (!value.isTextual()) return invalidPatch();
                    vehicle.setModel(value.asText());
                }
                case "category" -> {
                    if (!value.isTextual()) return invalidPatch();
                    vehicle.setCategory(value.asText());
                }
                case "transmission" -> {
                    if (!value.isTextual()) return invalidPatch();
                    vehicle.setTransmission(value.asText());
                }
                case "seats" -> {
                    if (!value.isIntegralNumber()) return invalidPatch();
                    vehicle.setSeats(value.asInt());
                }
                case "pricePerDay" -> {
                    if (!value.isNumber()) return invalidPatch();
                    vehicle.setPricePerDay(value.asDouble());
                }
                default -> { return invalidPatch(); }
            }
        }

        if (!validator.validate(vehicle).isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Vehicle fields are invalid."));
        }
        return ResponseEntity.ok(vehicles.save(vehicle));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!vehicles.existsById(id)) return ResponseEntity.notFound().build();
        vehicles.deleteById(id);
        return ResponseEntity.ok().build();
    }

    private ResponseEntity<Map<String, String>> invalidPatch() {
        return ResponseEntity.badRequest().body(Map.of("error", "Patch contains an unknown field or an invalid value type."));
    }
}
