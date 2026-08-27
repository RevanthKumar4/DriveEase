import { Feedback } from "./feedback.model";

describe('Feedback Model', () => {

  fit('Frontend_Feedback_model_should_create_an_instance_with_defined_properties', () => {
    // Create a sample Feedback object
    const feedback: Feedback = {
      feedbackId: 101,
      userId: 1,
      driverId: 202,
      category: 'Support',
      feedbackText: 'This is a feedback text.',
      date: new Date('2024-07-02'),
      rating : 2
    };

    expect(feedback).toBeTruthy();
    expect(feedback.feedbackId).toBe(101);
    expect(feedback.userId).toBe(1);
    expect(feedback.driverId).toBe(202);
    expect(feedback.category).toBe('Support');
    expect(feedback.feedbackText).toBe('This is a feedback text.');
    expect(feedback.date).toEqual(new Date('2024-07-02'));
  });


});
