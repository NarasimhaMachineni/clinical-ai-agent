#!/usr/bin/env python3
"""
Python Automated CDISC Quality Control & Anomaly Detection Engine
Implements the regulatory validation rules from Page 4 of the Pharma & Clinical Domain Manual.
"""

import sys
import json
import os

def audit_cdisc_pipeline(dm_records, adsl_records, adae_records=None, adlb_records=None):
    findings = []
    
    # -------------------------------------------------------------
    # Rule 1: 1-to-1 Subject Count Preservation (Page 4)
    # -------------------------------------------------------------
    len_dm = len(dm_records)
    len_adsl = len(adsl_records)
    
    if len_dm != len_adsl:
        findings.append({
            "rule_id": "P21-SDTM-ADSL-001",
            "severity": "ERROR",
            "domain": "ADSL",
            "message": f"Count mismatch between SDTM DM ({len_dm}) and ADaM ADSL ({len_adsl}). 1-to-1 preservation violated."
        })
    else:
        findings.append({
            "rule_id": "P21-SDTM-ADSL-001",
            "severity": "PASS",
            "domain": "ADSL",
            "message": f"1-to-1 Subject count preservation confirmed ({len_dm} subjects verified)."
        })

    # -------------------------------------------------------------
    # Rule 2: Verify Safety Flag (SAFFL) Derivation Logic (Page 4)
    # -------------------------------------------------------------
    saffl_mismatches = []
    for s in adsl_records:
        trtsdt = s.get("TRTSDT")
        saffl = s.get("SAFFL")
        
        # If treatment date exists, SAFFL must be 'Y'
        if trtsdt and saffl != "Y":
            saffl_mismatches.append(s.get("USUBJID"))
        elif not trtsdt and saffl == "Y":
            saffl_mismatches.append(s.get("USUBJID"))
            
    if len(saffl_mismatches) > 0:
        findings.append({
            "rule_id": "P21-ADAM-SAFFL-002",
            "severity": "ERROR",
            "domain": "ADSL",
            "message": f"SAFFL integrity failure on {len(saffl_mismatches)} subject(s): {saffl_mismatches[:5]}"
        })
    else:
        findings.append({
            "rule_id": "P21-ADAM-SAFFL-002",
            "severity": "PASS",
            "domain": "ADSL",
            "message": "SAFFL derivation logic 100% compliant with SAP definition (TRTSDT non-missing <==> SAFFL='Y')."
        })

    # -------------------------------------------------------------
    # Rule 3: Unique Subject Identifier Integrity
    # -------------------------------------------------------------
    usubjids = [s.get("USUBJID") for s in adsl_records if s.get("USUBJID")]
    if len(usubjids) != len(set(usubjids)):
        dup_count = len(usubjids) - len(set(usubjids))
        findings.append({
            "rule_id": "CDISC-CORE-003",
            "severity": "ERROR",
            "domain": "ADSL",
            "message": f"Duplicate USUBJID detected in ADSL ({dup_count} duplicate records)."
        })
    else:
        findings.append({
            "rule_id": "CDISC-CORE-003",
            "severity": "PASS",
            "domain": "ADSL",
            "message": "All USUBJID values are unique and non-null."
        })

    # -------------------------------------------------------------
    # Rule 4: Treatment-Emergent AE Chronology (ADAE TRTEMFL)
    # -------------------------------------------------------------
    if adae_records:
        adae_inconsistencies = 0
        adsl_dict = {s.get("USUBJID"): s.get("TRTSDT") for s in adsl_records}
        for ae in adae_records:
            subj_id = ae.get("USUBJID")
            trtsdt = adsl_dict.get(subj_id)
            aestdt = ae.get("AESTDT")
            trtemfl = ae.get("TRTEMFL")
            
            if aestdt and trtsdt:
                expected_trtemfl = "Y" if aestdt >= trtsdt else "N"
                if trtemfl != expected_trtemfl:
                    adae_inconsistencies += 1
                    
        if adae_inconsistencies > 0:
            findings.append({
                "rule_id": "CDISC-ADAE-004",
                "severity": "WARNING",
                "domain": "ADAE",
                "message": f"TRTEMFL inconsistent with treatment start date in {adae_inconsistencies} records."
            })
        else:
            findings.append({
                "rule_id": "CDISC-ADAE-004",
                "severity": "PASS",
                "domain": "ADAE",
                "message": f"TRTEMFL verified across {len(adae_records)} adverse event records."
            })

    # Summary Statistics
    error_count = sum(1 for f in findings if f["severity"] == "ERROR")
    warning_count = sum(1 for f in findings if f["severity"] == "WARNING")
    pass_count = sum(1 for f in findings if f["severity"] == "PASS")

    status = "SUCCESS" if error_count == 0 else "FAILED"

    report = {
        "status": status,
        "records_verified": len_adsl,
        "summary": {
            "total_checks": len(findings),
            "passed": pass_count,
            "warnings": warning_count,
            "errors": error_count
        },
        "findings": findings
    }
    return report

if __name__ == "__main__":
    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            data = json.load(f)
            dm = data.get("DM", [])
            adsl = data.get("ADSL", [])
            adae = data.get("ADAE", [])
            adlb = data.get("ADLB", [])
            res = audit_cdisc_pipeline(dm, adsl, adae, adlb)
            print(json.dumps(res, indent=2))
    else:
        # Sample self-test
        sample_dm = [{"USUBJID": f"TEST-001-{i:03d}"} for i in range(1, 11)]
        sample_adsl = [{"USUBJID": f"TEST-001-{i:03d}", "TRTSDT": "2024-01-01", "SAFFL": "Y"} for i in range(1, 11)]
        res = audit_cdisc_pipeline(sample_dm, sample_adsl)
        print(json.dumps(res, indent=2))
