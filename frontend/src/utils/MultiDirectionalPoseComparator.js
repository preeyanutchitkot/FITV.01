/**
 * 🎯 Advanced Multi-Directional Pose Comparator
 * ระบบเปรียบเทียบท่าทางแบบ 8 ทิศทาง โดยใช้มุมข้อต่อแทนตำแหน่งจุด
 * 
 * Concept: 
 * - คำนวณมุมข้อต่อหลักจาก keypoints (Joint Angles)
 * - แปลงเป็น 8 ทิศทาง (Front, Back, Left, Right, และ 4 เฉียง)
 * - เปรียบเทียบ trainee กับ trainer แบบ real-time
 */

export class MultiDirectionalPoseComparator {
  constructor() {
    // MediaPipe Pose landmark indices
    this.LANDMARKS = {
      // Upper body key points
      LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
      LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
      LEFT_WRIST: 15, RIGHT_WRIST: 16,
      LEFT_HIP: 23, RIGHT_HIP: 24,
      LEFT_KNEE: 25, RIGHT_KNEE: 26,
      LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
      NOSE: 0,
      LEFT_EAR: 7, RIGHT_EAR: 8
    };

    // Joint angle definitions - แต่ละมุมประกอบด้วย 3 จุด [จุดแรก, จุดกึ่งกลาง, จุดสุดท้าย]
    this.JOINT_ANGLES = {
      // แขนซ้าย
      LEFT_ARM_ANGLE: [this.LANDMARKS.LEFT_SHOULDER, this.LANDMARKS.LEFT_ELBOW, this.LANDMARKS.LEFT_WRIST],
      // แขนขวา  
      RIGHT_ARM_ANGLE: [this.LANDMARKS.RIGHT_SHOULDER, this.LANDMARKS.RIGHT_ELBOW, this.LANDMARKS.RIGHT_WRIST],
      // ขาซ้าย
      LEFT_LEG_ANGLE: [this.LANDMARKS.LEFT_HIP, this.LANDMARKS.LEFT_KNEE, this.LANDMARKS.LEFT_ANKLE],
      // ขาขวา
      RIGHT_LEG_ANGLE: [this.LANDMARKS.RIGHT_HIP, this.LANDMARKS.RIGHT_KNEE, this.LANDMARKS.RIGHT_ANKLE],
      // ลำตัวซ้าย
      LEFT_TORSO_ANGLE: [this.LANDMARKS.LEFT_SHOULDER, this.LANDMARKS.LEFT_HIP, this.LANDMARKS.LEFT_KNEE],
      // ลำตัวขวา
      RIGHT_TORSO_ANGLE: [this.LANDMARKS.RIGHT_SHOULDER, this.LANDMARKS.RIGHT_HIP, this.LANDMARKS.RIGHT_KNEE],
      // ไหล่ (shoulder alignment)
      SHOULDER_ANGLE: [this.LANDMARKS.LEFT_SHOULDER, this.LANDMARKS.NOSE, this.LANDMARKS.RIGHT_SHOULDER],
      // สะโพก (hip alignment)  
      HIP_ANGLE: [this.LANDMARKS.LEFT_HIP, this.LANDMARKS.NOSE, this.LANDMARKS.RIGHT_HIP]
    };

    // 8 ทิศทางหลัก (degrees)
    this.DIRECTIONS = {
      FRONT: 0,           // หน้าตรง
      FRONT_RIGHT: 45,    // เฉียงขวาหน้า
      RIGHT: 90,          // ข้างขวา
      BACK_RIGHT: 135,    // เฉียงขวาหลัง
      BACK: 180,          // หลัง
      BACK_LEFT: 225,     // เฉียงซ้ายหลัง
      LEFT: 270,          // ข้างซ้าย
      FRONT_LEFT: 315     // เฉียงซ้ายหน้า
    };

    // น้ำหนักความสำคัญของแต่ละข้อต่อ
    this.JOINT_WEIGHTS = {
      LEFT_ARM_ANGLE: 1.5,
      RIGHT_ARM_ANGLE: 1.5,
      LEFT_LEG_ANGLE: 2.0,
      RIGHT_LEG_ANGLE: 2.0,
      LEFT_TORSO_ANGLE: 2.5,
      RIGHT_TORSO_ANGLE: 2.5,
      SHOULDER_ANGLE: 1.8,
      HIP_ANGLE: 1.8
    };

    // Minimum visibility threshold
    this.MIN_VISIBILITY = 0.6;
  }

  /**
   * 🎯 Main comparison function - Multi-directional pose matching
   * @param {Array} trainerPose - Trainer's keypoints
   * @param {Array} traineePose - Trainee's keypoints (real-time)
   * @returns {Object} - Comparison result with accuracy and detailed analysis
   */
  compareMultiDirectional(trainerPose, traineePose) {
    if (!this.isValidPose(trainerPose) || !this.isValidPose(traineePose)) {
      return this.getErrorResult("Invalid pose data");
    }

    // 1. คำนวณมุมข้อต่อทั้งหมดของ trainer และ trainee
    const trainerAngles = this.calculateAllJointAngles(trainerPose);
    const traineeAngles = this.calculateAllJointAngles(traineePose);

    // 2. ระบุทิศทางหลักของแต่ละคน (ใช้ shoulder orientation)
    const trainerDirection = this.detectBodyDirection(trainerPose);
    const traineeDirection = this.detectBodyDirection(traineePose);

    // 3. คำนวณความต่างมุมข้อต่อแต่ละตัว
    const angleComparisons = this.compareJointAngles(trainerAngles, traineeAngles);

    // 4. คำนวณ accuracy โดยรวม
    const accuracy = this.calculateWeightedAccuracy(angleComparisons);

    // 5. สร้าง feedback และคำแนะนำ
    const feedback = this.generateDirectionalFeedback(accuracy, angleComparisons, trainerDirection, traineeDirection);

    return {
      accuracy: Math.round(accuracy),
      confidence: this.calculateConfidence(trainerAngles, traineeAngles),
      feedback,
      jointComparisons: angleComparisons,
      trainerDirection,
      traineeDirection,
      bodyPartScores: this.calculateBodyPartScores(angleComparisons),
      recommendations: this.generateRecommendations(angleComparisons)
    };
  }

  /**
   * 📐 คำนวณมุมระหว่างสามจุด (P1-P2-P3) โดย P2 เป็นจุดกึ่งกลาง
   */
  calculateAngle(p1, p2, p3) {
    if (!p1 || !p2 || !p3) return null;
    
    // คำนวณเวกเตอร์
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    // คำนวณมุมโดยใช้ dot product และ cross product
    const dot = v1.x * v2.x + v1.y * v2.y;
    const cross = v1.x * v2.y - v1.y * v2.x;
    
    let angle = Math.atan2(cross, dot) * (180 / Math.PI);
    
    // แปลงเป็น positive angle (0-360)
    if (angle < 0) angle += 360;
    
    return angle;
  }

  /**
   * 🔍 คำนวณมุมข้อต่อทั้งหมด
   */
  calculateAllJointAngles(pose) {
    const angles = {};
    
    Object.entries(this.JOINT_ANGLES).forEach(([jointName, [p1Idx, p2Idx, p3Idx]]) => {
      const p1 = pose[p1Idx];
      const p2 = pose[p2Idx];
      const p3 = pose[p3Idx];
      
      // ตรวจสอบว่าจุดทั้งสามมองเห็นได้ชัดเจน
      if (this.arePointsVisible([p1, p2, p3])) {
        angles[jointName] = this.calculateAngle(p1, p2, p3);
      } else {
        angles[jointName] = null; // ไม่สามารถคำนวณได้
      }
    });
    
    return angles;
  }

  /**
   * 🧭 ตรวจจับทิศทางร่างกายหลัก (ใช้ไหล่เป็นหลัก)
   */
  detectBodyDirection(pose) {
    const leftShoulder = pose[this.LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = pose[this.LANDMARKS.RIGHT_SHOULDER];
    const nose = pose[this.LANDMARKS.NOSE];
    
    if (!this.arePointsVisible([leftShoulder, rightShoulder, nose])) {
      return 'UNKNOWN';
    }
    
    // คำนวณมุมไหล่เปรียบเทียบกับแนวนอน
    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    ) * (180 / Math.PI);
    
    // แปลงเป็น positive angle
    let normalizedAngle = shoulderAngle < 0 ? shoulderAngle + 360 : shoulderAngle;
    
    // จับคู่กับทิศทางที่ใกล้ที่สุด
    let closestDirection = 'FRONT';
    let minDifference = Infinity;
    
    Object.entries(this.DIRECTIONS).forEach(([direction, angle]) => {
      const difference = Math.min(
        Math.abs(normalizedAngle - angle),
        Math.abs(normalizedAngle - angle + 360),
        Math.abs(normalizedAngle - angle - 360)
      );
      
      if (difference < minDifference) {
        minDifference = difference;
        closestDirection = direction;
      }
    });
    
    return closestDirection;
  }

  /**
   * ⚖️ เปรียบเทียบมุมข้อต่อระหว่าง trainer และ trainee
   */
  compareJointAngles(trainerAngles, traineeAngles) {
    const comparisons = {};
    
    Object.keys(this.JOINT_ANGLES).forEach(jointName => {
      const trainerAngle = trainerAngles[jointName];
      const traineeAngle = traineeAngles[jointName];
      
      if (trainerAngle !== null && traineeAngle !== null) {
        // คำนวณความต่างมุม (หาค่าที่น้อยที่สุดใน 360 องศา)
        let angleDiff = Math.abs(trainerAngle - traineeAngle);
        angleDiff = Math.min(angleDiff, 360 - angleDiff);
        
        // แปลงเป็นความแม่นยำ (ยิ่งต่างน้อย = แม่นยำมาก)
        const accuracy = Math.max(0, 100 - (angleDiff * 1.2)); // 1.2 เป็น sensitivity factor
        
        comparisons[jointName] = {
          trainerAngle: Math.round(trainerAngle),
          traineeAngle: Math.round(traineeAngle),
          angleDifference: Math.round(angleDiff),
          accuracy: Math.round(accuracy),
          weight: this.JOINT_WEIGHTS[jointName] || 1.0
        };
      } else {
        comparisons[jointName] = {
          trainerAngle: trainerAngle,
          traineeAngle: traineeAngle,
          angleDifference: null,
          accuracy: 0,
          weight: this.JOINT_WEIGHTS[jointName] || 1.0,
          error: 'Points not visible'
        };
      }
    });
    
    return comparisons;
  }

  /**
   * 📊 คำนวณ accuracy โดยรวมแบบมีน้ำหนัก
   */
  calculateWeightedAccuracy(angleComparisons) {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    Object.values(angleComparisons).forEach(comparison => {
      if (comparison.accuracy > 0) {
        totalWeightedScore += comparison.accuracy * comparison.weight;
        totalWeight += comparison.weight;
      }
    });
    
    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  }

  /**
   * 💬 สร้าง feedback ตามทิศทาง
   */
  generateDirectionalFeedback(accuracy, angleComparisons, trainerDirection, traineeDirection) {
    if (accuracy >= 90) {
      return "🎉 ยอดเยี่ยม! ท่าออกกำลังกายแม่นยำมาก";
    } else if (accuracy >= 80) {
      return "👍 ดีมาก! เกือบสมบูรณ์แล้ว";
    } else if (accuracy >= 70) {
      return "⚡ ใกล้เคียงแล้ว ปรับท่าเล็กน้อย";
    } else if (accuracy >= 60) {
      // หาข้อต่อที่แม่นยำน้อยที่สุด
      const worstJoint = this.findWorstJoint(angleComparisons);
      return `⚠️ ปรับ${this.getJointNameThai(worstJoint)}ให้ตรงมากขึ้น`;
    } else if (accuracy >= 40) {
      return `🔄 ลองหันหน้าไปทาง${this.getDirectionThai(trainerDirection)}เหมือนโค้ช`;
    } else {
      return "🎯 เริ่มใหม่ - ดูท่าของโค้ชอย่างละเอียด";
    }
  }

  /**
   * 🔍 หาข้อต่อที่มีความแม่นยำน้อยที่สุด
   */
  findWorstJoint(angleComparisons) {
    let worstJoint = null;
    let lowestAccuracy = 100;
    
    Object.entries(angleComparisons).forEach(([jointName, comparison]) => {
      if (comparison.accuracy < lowestAccuracy) {
        lowestAccuracy = comparison.accuracy;
        worstJoint = jointName;
      }
    });
    
    return worstJoint;
  }

  /**
   * 🏋️ คำนวณคะแนนแยกตามส่วนของร่างกาย
   */
  calculateBodyPartScores(angleComparisons) {
    const bodyParts = {
      'แขนซ้าย': ['LEFT_ARM_ANGLE'],
      'แขนขวา': ['RIGHT_ARM_ANGLE'],
      'ขาซ้าย': ['LEFT_LEG_ANGLE'],
      'ขาขวา': ['RIGHT_LEG_ANGLE'],
      'ลำตัว': ['LEFT_TORSO_ANGLE', 'RIGHT_TORSO_ANGLE'],
      'ท่าทาง': ['SHOULDER_ANGLE', 'HIP_ANGLE']
    };
    
    const scores = {};
    
    Object.entries(bodyParts).forEach(([bodyPart, joints]) => {
      let totalScore = 0;
      let count = 0;
      
      joints.forEach(joint => {
        if (angleComparisons[joint] && angleComparisons[joint].accuracy > 0) {
          totalScore += angleComparisons[joint].accuracy;
          count++;
        }
      });
      
      scores[bodyPart] = count > 0 ? totalScore / count : 0;
    });
    
    return scores;
  }

  /**
   * 💡 สร้างคำแนะนำเฉพาะ
   */
  generateRecommendations(angleComparisons) {
    const recommendations = [];
    
    Object.entries(angleComparisons).forEach(([jointName, comparison]) => {
      if (comparison.accuracy < 70 && comparison.accuracy > 0) {
        const suggestion = this.getJointSpecificSuggestion(jointName, comparison);
        if (suggestion) {
          recommendations.push({
            bodyPart: this.getJointNameThai(jointName),
            issue: `${this.getJointNameThai(jointName)}ยังไม่ตรงกับโค้ช`,
            suggestion: suggestion,
            accuracy: comparison.accuracy
          });
        }
      }
    });
    
    // Sort by accuracy (lowest first)
    return recommendations.sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
  }

  /**
   * 🎯 คำแนะนำเฉพาะสำหรับแต่ละข้อต่อ
   */
  getJointSpecificSuggestion(jointName, comparison) {
    const suggestions = {
      'LEFT_ARM_ANGLE': 'ปรับมุมแขนซ้ายให้ตรงกับโค้ช',
      'RIGHT_ARM_ANGLE': 'ปรับมุมแขนขวาให้ตรงกับโค้ช',
      'LEFT_LEG_ANGLE': 'ปรับมุมขาซ้ายให้ตรงกับโค้ช',
      'RIGHT_LEG_ANGLE': 'ปรับมุมขาขวาให้ตรงกับโค้ช',
      'LEFT_TORSO_ANGLE': 'ปรับท่าลำตัวซ้ายให้ตรงกับโค้ช',
      'RIGHT_TORSO_ANGLE': 'ปรับท่าลำตัวขวาให้ตรงกับโค้ช',
      'SHOULDER_ANGLE': 'ปรับระดับไหล่ให้เท่ากัน',
      'HIP_ANGLE': 'ปรับระดับสะโพกให้เท่ากัน'
    };
    
    return suggestions[jointName] || 'ปรับท่าให้ตรงกับโค้ช';
  }

  /**
   * 🇹🇭 แปลชื่อข้อต่อเป็นภาษาไทย
   */
  getJointNameThai(jointName) {
    const names = {
      'LEFT_ARM_ANGLE': 'แขนซ้าย',
      'RIGHT_ARM_ANGLE': 'แขนขวา',
      'LEFT_LEG_ANGLE': 'ขาซ้าย',
      'RIGHT_LEG_ANGLE': 'ขาขวา',
      'LEFT_TORSO_ANGLE': 'ลำตัวซ้าย',
      'RIGHT_TORSO_ANGLE': 'ลำตัวขวา',
      'SHOULDER_ANGLE': 'ไหล่',
      'HIP_ANGLE': 'สะโพก'
    };
    
    return names[jointName] || 'ท่าทาง';
  }

  /**
   * 🧭 แปลทิศทางเป็นภาษาไทย
   */
  getDirectionThai(direction) {
    const directions = {
      'FRONT': 'หน้าตรง',
      'FRONT_RIGHT': 'เฉียงขวาหน้า',
      'RIGHT': 'ข้างขวา',
      'BACK_RIGHT': 'เฉียงขวาหลัง',
      'BACK': 'หลัง',
      'BACK_LEFT': 'เฉียงซ้ายหลัง',
      'LEFT': 'ข้างซ้าย',
      'FRONT_LEFT': 'เฉียงซ้ายหน้า'
    };
    
    return directions[direction] || 'หน้าตรง';
  }

  /**
   * 📏 คำนวณ confidence level
   */
  calculateConfidence(trainerAngles, traineeAngles) {
    let validAngles = 0;
    let totalAngles = 0;
    
    Object.keys(this.JOINT_ANGLES).forEach(jointName => {
      totalAngles++;
      if (trainerAngles[jointName] !== null && traineeAngles[jointName] !== null) {
        validAngles++;
      }
    });
    
    return Math.round((validAngles / totalAngles) * 100);
  }

  /**
   * ✅ ตรวจสอบความถูกต้องของ pose data
   */
  isValidPose(pose) {
    return pose && 
           Array.isArray(pose) && 
           pose.length >= 33 && 
           pose.some(point => point?.visibility > this.MIN_VISIBILITY);
  }

  /**
   * 👁️ ตรวจสอบว่าจุดทั้งหมดมองเห็นได้
   */
  arePointsVisible(points) {
    return points.every(point => 
      point && 
      typeof point.visibility === 'number' && 
      point.visibility > this.MIN_VISIBILITY
    );
  }

  /**
   * ❌ สร้าง error result
   */
  getErrorResult(message) {
    return {
      accuracy: 0,
      confidence: 0,
      feedback: message,
      jointComparisons: {},
      trainerDirection: 'UNKNOWN',
      traineeDirection: 'UNKNOWN',
      bodyPartScores: {},
      recommendations: []
    };
  }

  /**
   * 🎨 สี accuracy สำหรับ UI
   */
  getAccuracyColor(accuracy) {
    if (accuracy >= 85) return '#22c55e'; // Green
    if (accuracy >= 70) return '#eab308'; // Yellow
    if (accuracy >= 50) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }
}

// Export singleton instance
export const multiDirectionalPoseComparator = new MultiDirectionalPoseComparator();
export default MultiDirectionalPoseComparator;