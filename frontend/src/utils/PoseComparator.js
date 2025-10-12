// PoseComparator.js
// เปรียบเทียบ keypoints ของ trainer และ trainee

const PoseComparator = {
  compare(trainerPose, traineePose) {
    // ตัวอย่าง: เปรียบเทียบ keypoints แบบง่าย (ควรปรับปรุงตามจริง)
    // trainerPose, traineePose: [{part: 'leftShoulder', x, y, score}, ...]
    let matched = 0;
    let total = trainerPose.length;
    let recommendations = [];
    let bodyPartScores = {};

    trainerPose.forEach((tp, idx) => {
      const part = tp.part;
      const trainee = traineePose.find(p => p.part === part);
      if (!trainee) return;
      const dx = Math.abs(tp.x - trainee.x);
      const dy = Math.abs(tp.y - trainee.y);
      const dist = Math.sqrt(dx*dx + dy*dy);
      // สมมติ threshold 0.1
      if (dist < 0.1) {
        matched++;
        bodyPartScores[part] = 100 - dist * 100;
      } else {
        bodyPartScores[part] = Math.max(0, 100 - dist * 300);
        recommendations.push({
          bodyPart: part,
          issue: 'ตำแหน่งยังไม่ตรงกับโค้ช',
          accuracy: bodyPartScores[part]
        });
      }
    });
    const accuracy = Math.round((matched / total) * 100);
    return { accuracy, bodyPartScores, recommendations };
  }
};

export default PoseComparator;
